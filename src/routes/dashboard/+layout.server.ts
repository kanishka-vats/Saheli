import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const { session, user } = await locals.safeGetSession();
	const isGuest = cookies.get('saheli_guest') === 'true';
	const guestDisplayName = cookies.get('saheli_display_name')?.trim();

	if (!session || !user) {
		if (!isGuest) {
			redirect(303, '/login');
		}
	}

	// Load profile
	const { data: profile } = (session && user) ? await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.maybeSingle() : { data: null };

	// Load recent period logs (last 3 months)
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	const { data: periodLogs } = (session && user) ? await locals.supabase
		.from('period_logs')
		.select('*')
		.eq('user_id', user.id)
		.gte('start_date', threeMonthsAgo.toISOString().split('T')[0])
		.order('start_date', { ascending: false }) : { data: [] };

	// Load recent mood logs (last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const { data: moodLogs } = (session && user) ? await locals.supabase
		.from('mood_logs')
		.select('*')
		.eq('user_id', user.id)
		.gte('date', thirtyDaysAgo.toISOString().split('T')[0])
		.order('date', { ascending: false }) : { data: [] };

	return {
		session,
		user,
		isGuest,
		profile: profile,
		display_name_fallback: guestDisplayName || user?.email?.split('@')[0] || 'Guest',
		periodLogs: periodLogs ?? [],
		moodLogs: moodLogs ?? []
	};
};
