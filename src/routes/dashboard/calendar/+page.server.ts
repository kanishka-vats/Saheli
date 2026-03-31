import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { periodLogs, profile } = await parent();
	return { periodLogs, profile };
};

export const actions: Actions = {
	logPeriod: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const startDate = formData.get('start_date') as string;
		const endDate = formData.get('end_date') as string | null;
		const flowIntensity = parseInt(formData.get('flow_intensity') as string) || 3;

		if (!startDate) return fail(400, { error: 'Start date is required' });

		// Check if there's already a log for this date — toggle it off
		const { data: existing } = await locals.supabase
			.from('period_logs')
			.select('id')
			.eq('user_id', user.id)
			.eq('start_date', startDate)
			.maybeSingle();

		if (existing) {
			await locals.supabase.from('period_logs').delete().eq('id', existing.id);
			return { success: true, action: 'deleted' };
		}

		const { error } = await locals.supabase.from('period_logs').insert({
			user_id: user.id,
			start_date: startDate,
			end_date: endDate || null,
			flow_intensity: flowIntensity
		});

		if (error) return fail(500, { error: error.message });
		return { success: true, action: 'created' };
	}
};
