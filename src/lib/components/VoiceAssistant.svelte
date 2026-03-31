<script lang="ts">
	import { onMount } from 'svelte';
	import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';
	import MicIcon from '$lib/components/icons/MicIcon.svelte';

	type ChatMessage = {
		role: 'user' | 'assistant';
		content: string;
	};

	let {
		chatHistory = [],
		languagePref = 'en'
	}: {
		chatHistory: ChatMessage[];
		languagePref: string;
	} = $props();

	// svelte-ignore state_referenced_locally
	let messages = $state<ChatMessage[]>([...chatHistory]);
	let textInput = $state('');
	let isRecording = $state(false);
	let isProcessing = $state(false);
	let isSpeaking = $state(false);
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let audioChunks = $state<Blob[]>([]);
	let chatContainer: HTMLDivElement | undefined = $state();
	let errorMessage = $state('');

	// Waveform
	let analyser = $state<AnalyserNode | null>(null);
	let animFrameId = $state(0);
	let waveformCanvas: HTMLCanvasElement | undefined = $state();
	let audioContext: AudioContext | null = $state(null);

	// TTS - preload voices
	let voices: SpeechSynthesisVoice[] = $state([]);

	onMount(() => {
		if ('speechSynthesis' in window) {
			// Load voices (they load async in most browsers)
			const loadVoices = () => {
				voices = window.speechSynthesis.getVoices();
			};
			loadVoices();
			window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

			// Chrome bug: speech synthesis stops after ~15 seconds
			// Workaround: resume periodically
			const keepAlive = setInterval(() => {
				if (window.speechSynthesis.speaking) {
					window.speechSynthesis.pause();
					window.speechSynthesis.resume();
				}
			}, 10000);

			return () => {
				window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
				clearInterval(keepAlive);
				window.speechSynthesis.cancel();
			};
		}
	});

	function scrollToBottom() {
		if (chatContainer) {
			setTimeout(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			}, 50);
		}
	}

	async function startRecording() {
		try {
			errorMessage = '';
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);

			const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
			audioChunks = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks.push(e.data);
			};

			recorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				cancelAnimationFrame(animFrameId);
				if (audioContext) {
					audioContext.close();
					audioContext = null;
				}
				const blob = new Blob(audioChunks, { type: 'audio/webm' });
				await sendAudio(blob);
			};

			recorder.start();
			mediaRecorder = recorder;
			isRecording = true;
			drawWaveform();
		} catch (err: any) {
			console.error('Mic access denied:', err);
			errorMessage = 'Microphone access denied. Please allow mic access in your browser settings.';
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	function drawWaveform() {
		if (!analyser || !waveformCanvas) return;
		const ctx = waveformCanvas.getContext('2d');
		if (!ctx) return;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		const W = waveformCanvas.width;
		const H = waveformCanvas.height;

		function draw() {
			animFrameId = requestAnimationFrame(draw);
			analyser!.getByteFrequencyData(dataArray);

			ctx!.clearRect(0, 0, W, H);

			const barCount = 40;
			const barWidth = W / barCount - 2;
			const step = Math.floor(bufferLength / barCount);

			for (let i = 0; i < barCount; i++) {
				const value = dataArray[i * step] / 255;
				const barHeight = Math.max(4, value * H * 0.8);
				const x = i * (barWidth + 2);
				const y = (H - barHeight) / 2;

				const gradient = ctx!.createLinearGradient(x, y, x, y + barHeight);
				gradient.addColorStop(0, '#87564B');
				gradient.addColorStop(1, '#CFA195');

				ctx!.fillStyle = gradient;
				ctx!.beginPath();
				ctx!.roundRect(x, y, barWidth, barHeight, 2);
				ctx!.fill();
			}
		}
		draw();
	}

	async function sendAudio(blob: Blob) {
		isProcessing = true;
		errorMessage = '';
		try {
			const formData = new FormData();
			formData.append('audio', blob, 'recording.webm');

			const res = await fetch('/api/chat', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();

			if (!res.ok) {
				errorMessage = data.error || 'Something went wrong';
				return;
			}

			if (data.userText) {
				messages = [...messages, { role: 'user', content: data.userText }];
			}
			if (data.assistantText) {
				messages = [...messages, { role: 'assistant', content: data.assistantText }];
				speak(data.assistantText);
			}
			scrollToBottom();
		} catch (err) {
			console.error('Chat error:', err);
			errorMessage = 'Failed to connect to the server. Please try again.';
		} finally {
			isProcessing = false;
		}
	}

	async function sendText() {
		if (!textInput.trim()) return;
		const text = textInput.trim();
		textInput = '';
		errorMessage = '';
		messages = [...messages, { role: 'user', content: text }];
		scrollToBottom();

		isProcessing = true;
		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});

			const data = await res.json();

			if (!res.ok) {
				errorMessage = data.error || 'Something went wrong';
				return;
			}

			if (data.assistantText) {
				messages = [...messages, { role: 'assistant', content: data.assistantText }];
				speak(data.assistantText);
			}
			scrollToBottom();
		} catch (err) {
			console.error('Chat error:', err);
			errorMessage = 'Failed to connect to the server. Please try again.';
		} finally {
			isProcessing = false;
		}
	}

	function speak(text: string) {
		if (!('speechSynthesis' in window)) return;

		// Cancel any ongoing speech
		window.speechSynthesis.cancel();

		// Small delay to let cancel take effect
		setTimeout(() => {
			const utterance = new SpeechSynthesisUtterance(text);

			// Detect if the text contains Devanagari (Hindi) characters
			const hasHindiChars = /[\u0900-\u097F]/.test(text);

			// For Devanagari, strictly use Hindi TTS. For Romanized (English/Hinglish), prioritize Indian English for a natural accent.
			const targetLangs = hasHindiChars ? ['hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en-US', 'en'];
			
			let preferredVoice: SpeechSynthesisVoice | undefined;

			for (const lang of targetLangs) {
				const matching = voices.filter(v => v.lang.startsWith(lang) || v.lang.replace('_', '-').startsWith(lang));
				if (matching.length > 0) {
					preferredVoice = matching.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('natural')) 
						|| matching.find(v => !v.localService) 
						|| matching[0];
					break;
				}
			}

			if (preferredVoice) {
				utterance.voice = preferredVoice;
				utterance.lang = preferredVoice.lang;
			} else {
				utterance.lang = hasHindiChars ? 'hi-IN' : 'en-IN';
			}
			utterance.rate = 0.95;
			utterance.pitch = 1.05;

			utterance.onstart = () => { isSpeaking = true; };
			utterance.onend = () => { isSpeaking = false; };
			utterance.onerror = (e) => {
				console.error('TTS error:', e);
				isSpeaking = false;
			};

			window.speechSynthesis.speak(utterance);
		}, 100);
	}

	function stopSpeaking() {
		window.speechSynthesis.cancel();
		isSpeaking = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendText();
		}
	}

	const quickPrompts = [
		'Where am I in my cycle?',
		'Why am I feeling tired?',
		'Tips for menstrual cramps',
		'When is my next period?'
	];
</script>

<div class="flex flex-col flex-1 min-h-0 w-full">
	<!-- Chat Messages -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
	>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center py-8 animate-fade-in">
				<div class="relative mb-6">
					<div class="w-24 h-24 rounded-full flex items-center justify-center text-saheli-primary" style="background: linear-gradient(135deg, var(--color-saheli-secondary-1), var(--color-saheli-secondary-2)); box-shadow: var(--shadow-glow);">
						<SaheliLogoIcon class="w-12 h-12" />
					</div>
					<div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm" style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); color: var(--color-saheli-bg); box-shadow: 0 2px 8px rgba(135, 86, 75, 0.4);">
						<MicIcon class="w-4 h-4" />
					</div>
				</div>
				<h3 class="text-xl font-bold mb-2" style="color: var(--color-saheli-text);">Hi, I'm Saheli!</h3>
				<p class="text-sm max-w-sm mb-6" style="color: var(--color-saheli-muted);">
					Your AI health companion. Ask me anything about your cycle, symptoms, or wellbeing — speak or type!
				</p>

				<!-- Quick Prompts -->
				<div class="flex flex-wrap items-center justify-center gap-2 max-w-md">
					{#each quickPrompts as prompt}
						<button
							onclick={() => { textInput = prompt; sendText(); }}
							class="px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 cursor-pointer"
							style="background: var(--color-saheli-secondary-1); color: var(--color-saheli-text); box-shadow: var(--shadow-soft);"
						>
							{prompt}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as msg, i}
			<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in">
				{#if msg.role === 'assistant'}
					<div class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 text-xs text-white" style="background: var(--color-saheli-secondary-2);">
						<SaheliLogoIcon class="w-4 h-4" />
					</div>
				{/if}
				<div
					class="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
					style="
						background: {msg.role === 'user'
							? 'linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent))'
							: 'var(--color-saheli-surface)'};
						color: {msg.role === 'user' ? 'white' : 'var(--color-saheli-text)'};
						box-shadow: {msg.role === 'assistant' ? 'var(--shadow-soft)' : 'none'};
						{msg.role === 'user' ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
					"
				>
					{msg.content}
				</div>
			</div>
		{/each}

		{#if isProcessing}
			<div class="flex justify-start animate-fade-in">
				<div class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 text-xs text-white" style="background: var(--color-saheli-secondary-2);">
					<SaheliLogoIcon class="w-4 h-4" />
				</div>
				<div class="px-4 py-3 rounded-2xl" style="background: var(--color-saheli-surface); box-shadow: var(--shadow-soft);">
					<div class="flex gap-1.5 items-center">
						<span class="w-2 h-2 rounded-full" style="background: var(--color-saheli-primary); animation: pulse-soft 1.4s ease-in-out infinite;"></span>
						<span class="w-2 h-2 rounded-full" style="background: var(--color-saheli-primary); animation: pulse-soft 1.4s ease-in-out 0.2s infinite;"></span>
						<span class="w-2 h-2 rounded-full" style="background: var(--color-saheli-primary); animation: pulse-soft 1.4s ease-in-out 0.4s infinite;"></span>
						<span class="text-xs ml-2" style="color: var(--color-saheli-muted);">Thinking...</span>
					</div>
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="flex justify-center animate-fade-in">
				<div class="px-4 py-2 rounded-xl text-xs" style="background: #fef2f2; color: #dc2626;">
					{errorMessage}
				</div>
			</div>
		{/if}
	</div>

	<!-- Waveform -->
	{#if isRecording}
		<div class="flex items-center justify-center mb-4 animate-fade-in">
			<div class="rounded-2xl px-6 py-4 flex items-center gap-4" style="background: linear-gradient(135deg, var(--color-saheli-secondary-1), var(--color-saheli-secondary-2)); box-shadow: var(--shadow-card);">
				<span class="w-3 h-3 rounded-full" style="background: #ef4444; animation: pulse-soft 1s ease-in-out infinite;"></span>
				<canvas bind:this={waveformCanvas} width="240" height="48" class="rounded"></canvas>
				<span class="text-xs font-semibold" style="color: var(--color-saheli-primary-dark);">Listening...</span>
			</div>
		</div>
	{/if}

	<!-- Speaking indicator -->
	{#if isSpeaking}
		<div class="flex items-center justify-center mb-3 animate-fade-in">
			<div class="flex items-center gap-2 px-4 py-2 rounded-full" style="background: var(--color-saheli-secondary-1);">
				<span class="text-sm">🔊</span>
				<span class="text-xs font-medium" style="color: var(--color-saheli-accent);">Saheli is speaking...</span>
				<button
					onclick={stopSpeaking}
					class="text-xs cursor-pointer px-2 py-0.5 rounded-full"
					style="background: var(--color-saheli-secondary-2); color: var(--color-saheli-accent);"
				>
					Stop
				</button>
			</div>
		</div>
	{/if}

	<!-- Input Area -->
	<div class="rounded-2xl p-3 flex items-end gap-3" style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card);">
		<!-- Voice Button -->
		<button
			onclick={() => isRecording ? stopRecording() : startRecording()}
			disabled={isProcessing}
			class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
			style="
				background: {isRecording ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent))'};
				box-shadow: {isRecording ? '0 0 24px rgba(239, 68, 68, 0.5)' : 'var(--shadow-glow)'};
				{isRecording ? 'animation: pulse-soft 1.5s ease-in-out infinite;' : ''}
			"
			title={isRecording ? 'Stop recording' : 'Start recording'}
		>
			{#if isRecording}⏹{:else}<MicIcon class="w-6 h-6" />{/if}
		</button>

		<!-- Text Input -->
		<div class="flex-1 relative">
			<textarea
				bind:value={textInput}
				onkeydown={handleKeydown}
				placeholder="Ask Saheli anything..."
				rows="1"
				class="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
				style="background: var(--color-saheli-secondary-1); color: var(--color-saheli-text); max-height: 120px;"
			></textarea>
		</div>

		<!-- Send -->
		<button
			onclick={sendText}
			disabled={!textInput.trim() || isProcessing}
			class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-200 cursor-pointer disabled:opacity-40"
			style="background: {textInput.trim() ? 'linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent))' : 'var(--color-saheli-secondary-2)'}; color: {textInput.trim() ? 'white' : 'var(--color-saheli-muted)'};"
			title="Send message"
		>
			↑
		</button>
	</div>
</div>
