import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) return { chatHistory: [], languagePref: 'en' };

	// Load recent chat history
	const { data: allHistory } = await locals.supabase
		.from('chat_history')
		.select('id, role, content, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: true })
		.limit(500);

	const messages = allHistory ?? [];
	const sessions: { id: string; title: string; messages: any[] }[] = [];
	
	let currentSessionMessages: any[] = [];
	let currentSessionId = 0;

	for (let i = 0; i < messages.length; i++) {
		const msg = messages[i];
		
		// If we hit a boundary, close current session and start a fresh one, but do not push the boundary message
		if (msg.content === '__NEW_CHAT_BOUNDARY__') {
			if (currentSessionMessages.length > 0) {
				sessions.push({
					id: currentSessionId.toString(),
					title: currentSessionMessages[0].content.substring(0, 30) + '...',
					messages: [...currentSessionMessages]
				});
				currentSessionMessages = [];
			}
			currentSessionId++;
			continue;
		}

		if (i === 0 || currentSessionMessages.length === 0) {
			currentSessionId++;
			currentSessionMessages.push(msg);
		} else {
			// Find previous real message to compare time (it might not be i-1 if boundary was hit, but close enough)
			const prevMsg = currentSessionMessages[currentSessionMessages.length - 1];
			const t1 = new Date(prevMsg.created_at).getTime();
			const t2 = new Date(msg.created_at).getTime();
			const hoursDiff = (t2 - t1) / (1000 * 60 * 60);

			if (hoursDiff > 2) {
				if (currentSessionMessages.length > 0) {
					sessions.push({
						id: currentSessionId.toString(),
						title: currentSessionMessages[0].content.substring(0, 30) + '...',
						messages: [...currentSessionMessages]
					});
				}
				currentSessionId++;
				currentSessionMessages = [msg];
			} else {
				currentSessionMessages.push(msg);
			}
		}
	}
	if (currentSessionMessages.length > 0) {
		sessions.push({
			id: currentSessionId.toString(),
			title: currentSessionMessages[0].content.substring(0, 30) + '...',
			messages: currentSessionMessages
		});
	}

	sessions.reverse(); // latest first

	// Load language preference
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('language_pref')
		.eq('id', user.id)
		.maybeSingle();

	return {
		chatSessions: sessions,
		languagePref: profile?.language_pref ?? 'en'
	};
};
