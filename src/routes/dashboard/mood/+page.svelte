<script lang="ts">
	import MoodCheckin from "$lib/components/MoodCheckin.svelte";
	import { invalidateAll } from "$app/navigation";
	import { createSupabaseBrowserClient } from "$lib/supabase/client";

	let { data } = $props();

	const supabase = createSupabaseBrowserClient();

	async function handleSave(checkinData: {
		mood_score: number;
		energy: number;
		symptoms: string[];
		notes: string;
	}) {
		const { error } = await supabase.from("mood_logs").insert({
			user_id: data.user?.id,
			mood_score: checkinData.mood_score,
			energy: checkinData.energy,
			symptoms: checkinData.symptoms,
			notes: checkinData.notes || null,
		});

		if (error) {
			console.error("Save error:", error);
			return;
		}

		// Re-fetch all server data so dashboard + mood history update
		await invalidateAll();
	}

	async function deleteEntry(id: string) {
		if (data.user?.id) {
			const { error } = await supabase
				.from("mood_logs")
				.delete()
				.eq("id", id);
			if (!error) {
				await invalidateAll();
			}
		}
	}
</script>

<svelte:head>
	<title>Mood Tracker — Saheli</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 animate-fade-in">
		<h1 class="text-2xl font-bold" style="color: var(--color-saheli-text);">
			Mood Tracker
		</h1>
		<p class="text-sm mt-1" style="color: var(--color-saheli-muted);">
			How are you feeling today?
		</p>
	</div>

	<div class="animate-fade-in mb-8" style="animation-delay: 0.1s;">
		<MoodCheckin onSave={handleSave} />
	</div>

	<!-- Recent History -->
	{#if data.moodLogs?.length}
		<div
			class="rounded-2xl p-6 animate-fade-in"
			style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card); animation-delay: 0.2s;"
		>
			<h2
				class="text-lg font-semibold mb-4"
				style="color: var(--color-saheli-text);"
			>
				Recent Entries
			</h2>
			<div class="space-y-3">
				{#each data.moodLogs.slice(0, 7) as log}
					<div
						class="flex items-center gap-4 px-4 py-3 rounded-xl relative group"
						style="background: var(--color-saheli-secondary-1);"
					>
						<div class="flex items-center justify-center">
							{#if log.mood_score === 1}
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									style="color: var(--color-saheli-text-2); opacity: 0.9;"
								>
									<circle cx="12" cy="12" r="10"
									></circle><path d="M8 15h8"></path><path
										d="M9 9l-1 2"
									></path><path d="M15 9l1 2"></path>
								</svg>
							{:else if log.mood_score === 2}
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									style="color: var(--color-saheli-text-2); opacity: 0.9;"
								>
									<circle cx="12" cy="12" r="10"
									></circle><path
										d="M16 16s-1.5-2-4-2-4 2-4 2"
									></path><line x1="9" y1="9" x2="9.01" y2="9"
									></line><line
										x1="15"
										y1="9"
										x2="15.01"
										y2="9"
									></line>
								</svg>
							{:else if log.mood_score === 3}
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									style="color: var(--color-saheli-text-2); opacity: 0.9;"
								>
									<circle cx="12" cy="12" r="10"
									></circle><line
										x1="8"
										y1="15"
										x2="16"
										y2="15"
									></line><line x1="9" y1="9" x2="9.01" y2="9"
									></line><line
										x1="15"
										y1="9"
										x2="15.01"
										y2="9"
									></line>
								</svg>
							{:else if log.mood_score === 4}
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									style="color: var(--color-saheli-text-2); opacity: 0.9;"
								>
									<circle cx="12" cy="12" r="10"
									></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"
									></path><line x1="9" y1="9" x2="9.01" y2="9"
									></line><line
										x1="15"
										y1="9"
										x2="15.01"
										y2="9"
									></line>
								</svg>
							{:else if log.mood_score === 5}
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									style="color: var(--color-saheli-text-2); opacity: 0.9;"
								>
									<circle cx="12" cy="12" r="10"
									></circle><path
										d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
									></path><path
										d="M8 14c0 3 8 3 8 0c0-1-8-1-8 0z"
										fill="currentColor"
										fill-opacity="0.2"
									></path>
								</svg>
							{/if}
						</div>
						<div class="flex-1">
							<p
								class="text-sm font-medium"
								style="color: var(--color-saheli-text-2);"
							>
								Mood {log.mood_score}/5 · Energy {log.energy}/5
							</p>
							{#if log.symptoms?.length}
								<p
									class="text-xs mt-0.5"
									style="color: var(--color-saheli-muted);"
								>
									{log.symptoms.join(", ")}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<span
								class="text-xs group-hover:hidden"
								style="color: var(--color-saheli-primary);"
							>
								{new Date(log.date).toLocaleDateString(
									"en-IN",
									{
										month: "short",
										day: "numeric",
									},
								)}
							</span>
							<button
								aria-label="Delete Mood Entry"
								onclick={() => deleteEntry(log.id)}
								class="hidden group-hover:flex items-center justify-center p-1.5 rounded bg-white/50 hover:bg-white text-saheli-text-2 hover:text-saheli-primary transition-all"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M3 6h18"></path><path
										d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
									></path><path
										d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
									></path></svg
								>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
