import { redirect, fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
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

		// Preferred path: authenticated user calls a SECURITY DEFINER DB function
		// to delete their own auth user record (and cascading data).
		const { error: rpcError } = await locals.supabase.rpc('delete_my_account');
		if (!rpcError) {
			await locals.supabase.auth.signOut();
			for (const cookie of cookies.getAll()) {
				if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
					cookies.delete(cookie.name, { path: '/' });
				}
			}
			throw redirect(303, '/login');
		}

		// Fallback path: service role admin deletion (for older DB setups without RPC).
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
		const supabaseUrl = PUBLIC_SUPABASE_URL;

		if (!serviceRoleKey || !supabaseUrl) {
			console.error('RPC delete_my_account failed and service role fallback unavailable:', rpcError);
			return fail(500, { message: 'Failed to delete account. Please contact support.' });
		}

		const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

		if (error) {
			console.error('Error deleting user (RPC + admin fallback failed):', { rpcError, error });
			return fail(500, { message: 'Failed to delete account. Please try again.' });
		}

		// Clear auth session cookies after deletion.
		await locals.supabase.auth.signOut();
		for (const cookie of cookies.getAll()) {
			if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
				cookies.delete(cookie.name, { path: '/' });
			}
		}
		
		throw redirect(303, '/login');
	}
};
