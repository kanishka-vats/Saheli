<script lang="ts">
	import VoiceAssistant from "$lib/components/VoiceAssistant.svelte";
	import CalendarIcon from "$lib/components/icons/CalendarIcon.svelte";
	import MoodIcon from "$lib/components/icons/MoodIcon.svelte";
	import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";

	let { data } = $props();

	// Compute current cycle day
	const cycleDay = $derived(() => {
		if (!data.periodLogs?.length) return null;
		const lastPeriod = data.periodLogs[0];
		const start = new Date(lastPeriod.start_date);
		const today = new Date();
		const diff = Math.floor(
			(today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
		);
		return diff + 1;
	});

	const nextPeriodIn = $derived(() => {
		if (!data.periodLogs?.length || !data.profile?.avg_cycle_length)
			return null;
		const cd = cycleDay();
		if (cd === null) return null;
		return Math.max(0, data.profile.avg_cycle_length - cd);
	});

	const latestMood = $derived(() => {
		if (!data.moodLogs?.length) return null;
		return data.moodLogs[0];
	});

	const moodEmojis = ["", "😞", "😟", "😐", "😊", "😄"];
</script>

<svelte:head>
	<title>Dashboard — Saheli</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<!-- Greeting -->
	<div class="mb-6 animate-fade-in">
		<h1
			class="text-2xl md:text-3xl font-bold flex items-center gap-2"
			style="color: var(--color-saheli-text);"
		>
			Hello, {data.profile?.display_name ?? "there"}
			<SaheliLogoIcon class="w-6 h-6 text-saheli-primary" />
		</h1>
		<p class="mt-1 text-sm" style="color: var(--color-saheli-muted);">
			Talk to Saheli or check your health overview
		</p>
	</div>

	<!-- AI Assistant Hero Card — the primary feature -->
	<div
		class="mb-6 animate-fade-in rounded-2xl overflow-hidden"
		style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card); animation-delay: 0.05s;"
	>
		<div class="flex flex-col p-1" style="height: 450px;">
			<VoiceAssistant
				chatHistory={[]}
				languagePref={data.profile?.language_pref ?? "en"}
			/>
		</div>
	</div>

	<!-- Health Overview — compact row -->
	<div
		class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-fade-in"
		style="animation-delay: 0.15s;"
	>
		<!-- Cycle Day Card -->
		<a
			href="/dashboard/calendar"
			class="rounded-2xl p-5 transition-all hover:scale-[1.02]"
			style="background: linear-gradient(135deg, var(--color-saheli-secondary-1), var(--color-saheli-bg)); box-shadow: var(--shadow-soft);"
		>
			<div class="flex items-center gap-3 mb-2">
				<div
					class="w-9 h-9 rounded-lg flex items-center justify-center text-saheli-primary"
					style="background: var(--color-saheli-border);"
				>
					<CalendarIcon class="w-5 h-5" />
				</div>
				<span
					class="text-xs font-medium"
					style="color: var(--color-saheli-muted);">Cycle Day</span
				>
			</div>
			<p
				class="text-2xl font-bold"
				style="color: var(--color-saheli-accent);"
			>
				{cycleDay() !== null ? `Day ${cycleDay()}` : "—"}
			</p>
			{#if nextPeriodIn() !== null}
				<p
					class="text-[10px] mt-0.5"
					style="color: var(--color-saheli-muted);"
				>
					{nextPeriodIn() === 0
						? "Period expected today"
						: `~${nextPeriodIn()} days left`}
				</p>
			{:else}
				<p
					class="text-[10px] mt-0.5"
					style="color: var(--color-saheli-muted);"
				>
					Tap to log
				</p>
			{/if}
		</a>

		<!-- Mood Card -->
		<a
			href="/dashboard/mood"
			class="rounded-2xl p-5 transition-all hover:scale-[1.02]"
			style="background: linear-gradient(135deg, var(--color-saheli-secondary-2), var(--color-saheli-secondary-1)); box-shadow: var(--shadow-soft);"
		>
			<div class="flex items-center gap-3 mb-2">
				<div
					class="w-9 h-9 rounded-lg flex items-center justify-center text-saheli-primary"
					style="background: var(--color-saheli-border);"
				>
					<MoodIcon class="w-5 h-5" />
				</div>
				<span
					class="text-xs font-medium"
					style="color: var(--color-saheli-muted);">Mood</span
				>
			</div>
			{#if latestMood()}
				<div class="flex items-center gap-2">
					{#if latestMood()!.mood_score === 1}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="color: var(--color-saheli-primary); opacity: 0.9;"
						>
							<circle cx="12" cy="12" r="10"></circle><path
								d="M8 15h8"
							></path><path d="M9 9l-1 2"></path><path
								d="M15 9l1 2"
							></path>
						</svg>
					{:else if latestMood()!.mood_score === 2}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="color: var(--color-saheli-primary); opacity: 0.9;"
						>
							<circle cx="12" cy="12" r="10"></circle><path
								d="M16 16s-1.5-2-4-2-4 2-4 2"
							></path><line x1="9" y1="9" x2="9.01" y2="9"
							></line><line x1="15" y1="9" x2="15.01" y2="9"
							></line>
						</svg>
					{:else if latestMood()!.mood_score === 3}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="color: var(--color-saheli-primary); opacity: 0.9;"
						>
							<circle cx="12" cy="12" r="10"></circle><line
								x1="8"
								y1="15"
								x2="16"
								y2="15"
							></line><line x1="9" y1="9" x2="9.01" y2="9"
							></line><line x1="15" y1="9" x2="15.01" y2="9"
							></line>
						</svg>
					{:else if latestMood()!.mood_score === 4}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="color: var(--color-saheli-primary); opacity: 0.9;"
						>
							<circle cx="12" cy="12" r="10"></circle><path
								d="M8 14s1.5 2 4 2 4-2 4-2"
							></path><line x1="9" y1="9" x2="9.01" y2="9"
							></line><line x1="15" y1="9" x2="15.01" y2="9"
							></line>
						</svg>
					{:else if latestMood()!.mood_score === 5}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							style="color: var(--color-saheli-primary); opacity: 0.9;"
						>
							<circle cx="12" cy="12" r="10"></circle><path
								d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
							></path><path
								d="M8 14c0 3 8 3 8 0c0-1-8-1-8 0z"
								fill="currentColor"
								fill-opacity="0.2"
							></path>
						</svg>
					{/if}
					<p
						class="text-2xl font-bold"
						style="color: var(--color-saheli-accent);"
					>
						{latestMood()!.mood_score}/5
					</p>
				</div>
				<p
					class="text-[10px] mt-0.5"
					style="color: var(--color-saheli-muted);"
				>
					Energy: {latestMood()!.energy}/5
				</p>
			{:else}
				<p
					class="text-base font-medium"
					style="color: var(--color-saheli-accent);"
				>
					Not logged
				</p>
				<p
					class="text-[10px] mt-0.5"
					style="color: var(--color-saheli-muted);"
				>
					Tap to check in
				</p>
			{/if}
		</a>

		<!-- Symptoms Card -->
		<div
			class="rounded-2xl p-5"
			style="background: linear-gradient(135deg, var(--color-saheli-secondary-1), var(--color-saheli-border)); box-shadow: var(--shadow-soft);"
		>
			<div class="flex items-center gap-3 mb-2">
				<div
					class="w-9 h-9 rounded-lg flex items-center justify-center text-saheli-primary"
					style="background: var(--color-saheli-border);"
				>
					<SaheliLogoIcon class="w-5 h-5" />
				</div>
				<span
					class="text-xs font-medium"
					style="color: var(--color-saheli-muted);">Symptoms</span
				>
			</div>
			{#if data.moodLogs?.length}
				{@const allSymptoms = [
					...new Set(
						data.moodLogs.flatMap((l: any) => l.symptoms || []),
					),
				].slice(0, 3)}
				{#if allSymptoms.length}
					<div class="flex flex-wrap gap-1">
						{#each allSymptoms as s}
							<span
								class="px-2 py-0.5 rounded-full text-[10px] font-medium"
								style="background: var(--color-saheli-border); color: var(--color-saheli-text);"
								>{s}</span
							>
						{/each}
					</div>
				{:else}
					<p
						class="text-base font-medium"
						style="color: var(--color-saheli-primary);"
					>
						All clear
					</p>
				{/if}
			{:else}
				<p
					class="text-base font-medium"
					style="color: var(--color-saheli-primary);"
				>
					No data yet
				</p>
			{/if}
		</div>
	</div>
</div>
