<script lang="ts">
	import Calendar from '$lib/components/Calendar.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import { invalidateAll } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();
	const supabase = createSupabaseBrowserClient();

	let startDate = $state('');
	let showModal = $state(false);
	let flowIntensity = $state(3);
	let saving = $state(false);

	function handleLogPeriod(date: string) {
		startDate = date;
		flowIntensity = 3;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	async function savePeriodLog() {
		if (!startDate || saving) return;
		saving = true;

		// Check if there's already a log for this date — toggle it off
		const { data: existing } = await supabase
			.from('period_logs')
			.select('id')
			.eq('user_id', data.user?.id)
			.eq('start_date', startDate)
			.maybeSingle();

		if (existing) {
			await supabase.from('period_logs').delete().eq('id', existing.id);
		} else {
			await supabase.from('period_logs').insert({
				user_id: data.user?.id,
				start_date: startDate,
				end_date: null,
				flow_intensity: flowIntensity
			});
		}

		saving = false;
		closeModal();
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Period Calendar — Saheli</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 animate-fade-in">
		<h1 class="text-2xl font-bold flex items-center gap-2" style="color: var(--color-saheli-text);">
			Period Calendar <CalendarIcon class="w-6 h-6 text-saheli-primary" />
		</h1>
		<p class="text-sm mt-1" style="color: var(--color-saheli-muted);">Track your cycle and see predictions</p>
	</div>

	<div class="animate-fade-in" style="animation-delay: 0.1s;">
		<Calendar
			periodLogs={data.periodLogs}
			avgCycleLength={data.profile?.avg_cycle_length ?? 28}
			onLogPeriod={handleLogPeriod}
		/>
	</div>
</div>

<!-- Log Period Modal -->
{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.3);"
		onclick={closeModal}
	>
		<div
			class="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
			style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card);"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold mb-4" style="color: var(--color-saheli-text);">
				Log Period — {startDate}
			</h3>

			<div class="mb-4">
				<label for="flow-intensity" class="block text-sm font-medium mb-2" style="color: var(--color-saheli-text);">
					Flow Intensity: <span class="font-bold" style="color: var(--color-saheli-primary);">{flowIntensity}/5</span>
				</label>
				<input
					id="flow-intensity"
					type="range"
					min="1"
					max="5"
					step="1"
					bind:value={flowIntensity}
					class="w-full"
					style="accent-color: var(--color-saheli-primary);"
				/>
				<div class="flex justify-between text-[10px] mt-1" style="color: var(--color-saheli-muted);">
					<span>Light</span>
					<span>Heavy</span>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					type="button"
					onclick={closeModal}
					class="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
					style="background: var(--color-rose-50); color: var(--color-saheli-text);"
				>
					Cancel
				</button>
				<button
					onclick={savePeriodLog}
					disabled={saving}
					class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent));"
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}
