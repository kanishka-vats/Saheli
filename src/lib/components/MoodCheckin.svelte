<script lang="ts">
	let {
		onSave
	}: {
		onSave?: (data: { mood_score: number; energy: number; symptoms: string[]; notes: string }) => void;
	} = $props();

	let moodScore = $state(3);
	let energy = $state(3);
	let selectedSymptoms = $state<string[]>([]);
	let notes = $state('');
	let saved = $state(false);

	const moodEmojis = [
		{ value: 1, emoji: '😞', label: 'Terrible' },
		{ value: 2, emoji: '😟', label: 'Bad' },
		{ value: 3, emoji: '😐', label: 'Okay' },
		{ value: 4, emoji: '😊', label: 'Good' },
		{ value: 5, emoji: '😄', label: 'Great' }
	];

	const symptomOptions = [
		'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Back pain',
		'Nausea', 'Breast tenderness', 'Mood swings', 'Insomnia', 'Acne'
	];

	function toggleSymptom(s: string) {
		if (selectedSymptoms.includes(s)) {
			selectedSymptoms = selectedSymptoms.filter((x) => x !== s);
		} else {
			selectedSymptoms = [...selectedSymptoms, s];
		}
	}

	function handleSave() {
		onSave?.({ mood_score: moodScore, energy, symptoms: selectedSymptoms, notes });
		saved = true;
		setTimeout(() => saved = false, 3000);
	}
</script>

<div class="rounded-2xl p-6" style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card);">
	<h2 class="text-lg font-semibold mb-1" style="color: var(--color-saheli-text);">Daily Check-in</h2>
	<p class="text-sm mb-6" style="color: var(--color-saheli-muted);">How are you feeling today?</p>

	<!-- Mood -->
	<div class="mb-6">
		<span class="block text-sm font-medium mb-3" style="color: var(--color-saheli-text);">Mood</span>
		<div class="flex items-center justify-between gap-2">
			{#each moodEmojis as m}
				<button
					onclick={() => moodScore = m.value}
					class="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 cursor-pointer"
					style="
						background: {moodScore === m.value ? 'var(--color-saheli-secondary-1)' : 'transparent'};
						transform: {moodScore === m.value ? 'scale(1.15)' : 'scale(1)'};
						box-shadow: {moodScore === m.value ? 'var(--shadow-soft)' : 'none'};
					"
				>
					{#if m.value === 1}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-primary); opacity: 0.9;">
							<circle cx="12" cy="12" r="10"></circle><path d="M8 15h8"></path><path d="M9 9l-1 2"></path><path d="M15 9l1 2"></path>
						</svg>
					{:else if m.value === 2}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-primary); opacity: 0.9;">
							<circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
						</svg>
					{:else if m.value === 3}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-primary); opacity: 0.9;">
							<circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
						</svg>
					{:else if m.value === 4}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-primary); opacity: 0.9;">
							<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
						</svg>
					{:else if m.value === 5}
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-primary); opacity: 0.9;">
							<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"></path><path d="M8 14c0 3 8 3 8 0c0-1-8-1-8 0z" fill="currentColor" fill-opacity="0.2"></path>
						</svg>
					{/if}
					
					<span class="text-[10px] font-medium" style="color: {moodScore === m.value ? 'var(--color-saheli-primary)' : 'var(--color-saheli-muted)'};">{m.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Energy -->
	<div class="mb-6">
		<label for="energy-range" class="block text-sm font-medium mb-3" style="color: var(--color-saheli-text);">
			Energy Level: <span class="font-bold" style="color: var(--color-saheli-primary);">{energy}/5</span>
		</label>
		<input
			id="energy-range"
			type="range"
			min="1"
			max="5"
			step="1"
			bind:value={energy}
			class="w-full h-2 rounded-full appearance-none cursor-pointer"
			style="background: linear-gradient(to right, var(--color-saheli-secondary-2), var(--color-saheli-primary)); accent-color: var(--color-saheli-primary);"
		/>
		<div class="flex justify-between text-[10px] mt-1" style="color: var(--color-saheli-muted);">
			<span>Low</span>
			<span>High</span>
		</div>
	</div>

	<!-- Symptoms -->
	<div class="mb-6">
		<span class="block text-sm font-medium mb-3" style="color: var(--color-saheli-text);">Physical Symptoms</span>
		<div class="flex flex-wrap gap-2">
			{#each symptomOptions as symptom}
				<button
					onclick={() => toggleSymptom(symptom)}
					class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
					style="
						background: {selectedSymptoms.includes(symptom) ? 'var(--color-saheli-primary)' : 'var(--color-saheli-secondary-1)'};
						color: {selectedSymptoms.includes(symptom) ? 'white' : 'var(--color-saheli-text)'};
						box-shadow: {selectedSymptoms.includes(symptom) ? 'var(--shadow-soft)' : 'none'};
					"
				>
					{symptom}
				</button>
			{/each}
		</div>
	</div>

	<!-- Notes -->
	<div class="mb-6">
		<label for="notes" class="block text-sm font-medium mb-2" style="color: var(--color-saheli-text);">Notes (optional)</label>
		<textarea
			id="notes"
			bind:value={notes}
			placeholder="Anything else you'd like to note..."
			rows="2"
			class="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
			style="background: var(--color-saheli-secondary-1); border: 2px solid transparent; color: var(--color-saheli-text);"
			onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-saheli-primary)')}
			onblur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
		></textarea>
	</div>

	<!-- Save -->
	<button
		onclick={handleSave}
		class="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90"
		style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); box-shadow: var(--shadow-glow);"
	>
		{saved ? '✅ Saved!' : 'Save Check-in'}
	</button>
</div>
