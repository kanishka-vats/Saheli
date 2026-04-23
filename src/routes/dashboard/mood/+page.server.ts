import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { moodSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { moodLogs } = await parent();
	return { moodLogs };
};

export const actions: Actions = {
	checkin: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const mood_score = parseInt(formData.get('mood_score') as string);
		const energy = parseInt(formData.get('energy') as string);
		const symptomsRaw = formData.get('symptoms') as string;
		const notes = formData.get('notes') as string;
		const today = new Date().toISOString().split('T')[0];

		const symptoms = symptomsRaw ? symptomsRaw.split(',').filter(Boolean) : [];

		try {
			const validated = moodSchema.parse({
				mood_score,
				energy: energy || 3,
				symptoms,
				notes: notes || undefined
			});

			const { error } = await locals.supabase.from('mood_logs').insert({
				user_id: user.id,
				mood_score: validated.mood_score,
				energy: validated.energy,
				symptoms: validated.symptoms,
				notes: validated.notes || null,
				date: today
			});

			if (error) {
				console.error('Mood insert error:', error);
				return fail(500, { error: 'Failed to save mood log' });
			}
			return { success: true };
		} catch (err) {
			return fail(400, { error: 'Invalid mood data provided' });
		}
	},
	delete: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Missing entry ID' });

		const { error } = await locals.supabase
			.from('mood_logs')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) {
			console.error('Mood delete error:', error);
			return fail(500, { error: 'Failed to delete mood log' });
		}
		return { success: true };
	}
};
