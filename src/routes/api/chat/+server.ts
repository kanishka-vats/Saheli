import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';

const groq = new Groq({ apiKey: GROQ_API_KEY });

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let userText = '';

	// Determine if audio or text
	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		// Audio transcription via Groq Whisper
		const formData = await request.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			return json({ error: 'No audio file provided' }, { status: 400 });
		}

		try {
			const transcription = await groq.audio.transcriptions.create({
				file: audioFile,
				model: 'whisper-large-v3-turbo',
				response_format: 'json'
			});
			userText = transcription.text;
		} catch (err: any) {
			console.error('Transcription error:', err);
			return json({ error: 'Transcription failed: ' + err.message }, { status: 500 });
		}
	} else {
		// Text input
		const body = await request.json();
		userText = body.text || '';
	}

	if (!userText.trim()) {
		return json({ error: 'No input provided' }, { status: 400 });
	}

	// ── Fetch Context: Last 3 months of period & mood logs ──
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
	const dateStr = threeMonthsAgo.toISOString().split('T')[0];

	const [periodResult, moodResult, profileResult] = await Promise.all([
		locals.supabase
			.from('period_logs')
			.select('start_date, end_date, flow_intensity')
			.eq('user_id', user.id)
			.gte('start_date', dateStr)
			.order('start_date', { ascending: false }),
		locals.supabase
			.from('mood_logs')
			.select('date, mood_score, energy, symptoms, notes')
			.eq('user_id', user.id)
			.gte('date', dateStr)
			.order('date', { ascending: false })
			.limit(30),
		locals.supabase
			.from('profiles')
			.select('display_name, language_pref, avg_cycle_length')
			.eq('id', user.id)
			.single()
	]);

	const periodLogs = periodResult.data ?? [];
	const moodLogs = moodResult.data ?? [];
	const profile = profileResult.data;

	// ── Compute cycle context ──
	let cycleContext = 'No period data available yet.';
	if (periodLogs.length > 0) {
		const lastPeriod = periodLogs[0];
		const daysSincePeriod = Math.floor(
			(Date.now() - new Date(lastPeriod.start_date).getTime()) / (1000 * 60 * 60 * 24)
		);
		const cycleLength = profile?.avg_cycle_length || 28;
		const cycleDay = daysSincePeriod + 1;
		const daysUntilNext = Math.max(0, cycleLength - daysSincePeriod);

		cycleContext = `She is on cycle day ${cycleDay} (avg cycle: ${cycleLength} days). Last period started on ${lastPeriod.start_date}${lastPeriod.end_date ? `, ended on ${lastPeriod.end_date}` : ''}, flow intensity: ${lastPeriod.flow_intensity}/5. Next period expected in ~${daysUntilNext} days.`;

		if (periodLogs.length > 1) {
			cycleContext += `\nPrevious periods: ${periodLogs.slice(1, 4).map((l) => l.start_date).join(', ')}.`;
		}
	}

	let moodContext = 'No recent mood data.';
	if (moodLogs.length > 0) {
		const recent = moodLogs.slice(0, 5);
		moodContext = `Recent moods: ${recent.map((m) => `${m.date}: mood ${m.mood_score}/5, energy ${m.energy}/5${m.symptoms?.length ? `, symptoms: ${m.symptoms.join(', ')}` : ''}`).join(' | ')}`;
	}

	const langInstruction = profile?.language_pref === 'hi'
		? 'IMPORTANT LANGUAGE RULES: Respond mostly in conversational Hindi. However, if the user explicitly asks you to speak in Hinglish or uses Romanized Hindi, you MUST write your entire response in Romanized Hindi (using the English alphabet, mixing Hindi and English words naturally, e.g., "Theek hai, ab se hum aise hi baat karenge!").'
		: 'IMPORTANT LANGUAGE RULES: Respond in conversational English. However, if the user explicitly asks you to speak in Hinglish or uses Romanized Hindi along with their English, you MUST reply in natural Romanized Hindi mixed with English words (e.g., "Mujhe lagta hai aapko thoda aaram karna chahiye, health is important!").';

	const systemPrompt = `You are Saheli (सहेली), a fun, relatable, and knowledgeable menstrual health buddy. You are NOT a mother figure — you are the user's same-age best friend / bestie who happens to know a lot about health.

## Your Personality
- Talk like a chill, caring friend — NOT like a parent or elder. 
- Use casual, warm, soft, and somewhat funny/playful language. Keep it highly supportive.
- Be real and honest, not preachy. Keep it conversational, like texting your best friend.
- Validate feelings genuinely — "ugh that sucks" > "I understand your pain, dear"

## User Context
- Name: ${profile?.display_name || 'User'}
- ${cycleContext}
- ${moodContext}

## Language
${langInstruction}
You must adapt seamlessly to the user's language shifts. If they want Hinglish, give them perfect street-smart Hinglish.

## Guidelines
1. Keep it casual and conversational. No lectures. Talk like friends do.
2. Give accurate health info but wrapped in a friendly, relatable way.
3. If something sounds serious, be real about it: "hey, that doesn't sound normal — might wanna check with a doc?"
4. Normalize everything — periods, symptoms, moods. Zero stigma, zero awkwardness.
5. STRICTLY DO NOT USE ANY EMOJIS in your response. Instead, express your emotions organically using your soft, supportive, and funny tone through words. Do not let any emoji slip through.
6. Keep responses short and punchy (2-3 paragraphs max). Nobody wants a Wikipedia article.
7. If asked about non-health stuff, be chill about it but gently steer back.

## Medical Disclaimer
You're an AI bestie, not a doctor. When giving health advice, casually mention that seeing a real doc is always a good idea for serious stuff. Keep disclaimer brief and natural, not robotic.`;


	// ── Call Groq LLM ──
	try {
		const chatCompletion = await groq.chat.completions.create({
			model: 'llama-3.3-70b-versatile',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userText }
			],
			temperature: 0.7,
			max_tokens: 1024
		});

		const assistantText = chatCompletion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

		// ── Save to chat_history ──
		await Promise.all([
			locals.supabase.from('chat_history').insert({
				user_id: user.id,
				role: 'user',
				content: userText
			}),
			locals.supabase.from('chat_history').insert({
				user_id: user.id,
				role: 'assistant',
				content: assistantText
			})
		]);

		return json({ userText, assistantText });
	} catch (err: any) {
		console.error('LLM error:', err);
		return json({ error: 'AI response failed: ' + err.message }, { status: 500 });
	}
};
