import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

// Basic In-Memory Rate Limiter (100 requests per 10 minutes per IP)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const MAX_REQUESTS = 100;
const WINDOW_MS = 10 * 60 * 1000;

export const handle: Handle = async ({ event, resolve }) => {
	// Rate Limiting Logic
	const ip = event.getClientAddress();
	const now = Date.now();
	
	let record = rateLimitMap.get(ip);
	if (!record || record.expiresAt < now) {
		record = { count: 1, expiresAt: now + WINDOW_MS };
	} else {
		record.count++;
	}
	rateLimitMap.set(ip, record);

	if (record.count > MAX_REQUESTS) {
		throw error(429, 'Too many requests, please try again later.');
	}

	event.locals.supabase = createSupabaseServerClient(event);

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) return { session: null, user: null };

		// Validate the user by making a server call (getSession only reads the cookie)
		const {
			data: { user },
			error: err
		} = await event.locals.supabase.auth.getUser();

		if (err) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	// Append Security Headers
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
