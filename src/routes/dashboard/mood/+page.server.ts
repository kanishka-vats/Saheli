import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { moodLogs } = await parent();
	return { moodLogs };
};

export const actions: Actions = {
	checkin: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const moodScore = parseInt(formData.get('mood_score') as string);
		const energy = parseInt(formData.get('energy') as string);
		const symptomsRaw = formData.get('symptoms') as string;
		const notes = formData.get('notes') as string;

		const symptoms = symptomsRaw ? symptomsRaw.split(',').filter(Boolean) : [];

		if (!moodScore || moodScore < 1 || moodScore > 5) {
			return fail(400, { error: 'Invalid mood score' });
		}

		const { error } = await locals.supabase.from('mood_logs').insert({
			user_id: user.id,
			mood_score: moodScore,
			energy: energy || 3,
			symptoms,
			notes: notes || null
		});

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
