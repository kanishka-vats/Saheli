import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { profileSchema } from '$lib/schemas';

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const display_name = formData.get('display_name') as string;
		const avgCycleLength = Number(formData.get('avgCycleLength'));
		const periodLength = Number(formData.get('periodLength'));

		try {
			const validated = profileSchema.parse({
				display_name,
				avgCycleLength,
				periodLength
			});

			const { error } = await locals.supabase
				.from('profiles')
				.upsert({
					id: user.id,
					display_name: validated.display_name,
					avg_cycle_length: validated.avgCycleLength
				});

			if (error) {
				console.error('Profile update error:', error);
				return fail(500, { message: error.message });
			}

			return { success: true };
		} catch (err: any) {
			console.error('Validation error:', err);
			return fail(400, { message: err.message || 'Invalid input' });
		}
	}
};
