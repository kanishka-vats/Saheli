import { redirect, fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Actions } from './$types';

export const actions: Actions = {
	deleteAccount: async ({ locals, cookies }) => {
		const { session, user } = await locals.safeGetSession();
		const isGuest = cookies.get('saheli_guest') === 'true';

		// Case 1: Guest User
		if (isGuest) {
			cookies.delete('saheli_guest', { path: '/' });
			cookies.delete('saheli_display_name', { path: '/' });
			throw redirect(303, '/login');
		}

		// Case 2: Authenticated User
		if (!session || !user) {
			return fail(401, { message: 'Unauthorized' });
		}

		// Use the service role key to bypass RLS and delete the user from auth.users
		// The cascade constraints in the DB will clean up the profiles and logs
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
		const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
		
		if (!serviceRoleKey || !supabaseUrl) {
			return fail(500, {
				message: 'Server configuration missing for account deletion.'
			});
		}

		const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

		if (error) {
			console.error('Error deleting user:', error);
			return fail(500, { message: 'Failed to delete account. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured.' });
		}

		// Clear the session and redirect
		await locals.supabase.auth.signOut();
		
		throw redirect(303, '/login');
	}
};
