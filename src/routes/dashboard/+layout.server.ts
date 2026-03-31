import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		redirect(303, '/login');
	}

	// Load profile
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	// Load recent period logs (last 3 months)
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	const { data: periodLogs } = await locals.supabase
		.from('period_logs')
		.select('*')
		.eq('user_id', user.id)
		.gte('start_date', threeMonthsAgo.toISOString().split('T')[0])
		.order('start_date', { ascending: false });

	// Load recent mood logs (last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const { data: moodLogs } = await locals.supabase
		.from('mood_logs')
		.select('*')
		.eq('user_id', user.id)
		.gte('date', thirtyDaysAgo.toISOString().split('T')[0])
		.order('date', { ascending: false });

	return {
		session,
		user,
		profile: profile ?? { display_name: user.email?.split('@')[0], language_pref: 'en', avg_cycle_length: 28 },
		periodLogs: periodLogs ?? [],
		moodLogs: moodLogs ?? []
	};
};
