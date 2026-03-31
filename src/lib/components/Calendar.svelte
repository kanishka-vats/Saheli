<script lang="ts">
	import type { Snippet } from 'svelte';

	type PeriodLog = {
		id: string;
		start_date: string;
		end_date: string | null;
		flow_intensity: number;
	};

	let {
		periodLogs = [],
		avgCycleLength = 28,
		onLogPeriod
	}: {
		periodLogs: PeriodLog[];
		avgCycleLength: number;
		onLogPeriod?: (date: string) => void;
	} = $props();

	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	const firstDayOfWeek = $derived(new Date(currentYear, currentMonth, 1).getDay());

	// Build set of period day strings "YYYY-MM-DD"
	const periodDays = $derived(() => {
		const days = new Set<string>();
		for (const log of periodLogs) {
			const start = new Date(log.start_date);
			const end = log.end_date ? new Date(log.end_date) : new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000); // default 5 days
			let cursor = new Date(start);
			while (cursor <= end) {
				days.add(cursor.toISOString().split('T')[0]);
				cursor.setDate(cursor.getDate() + 1);
			}
		}
		return days;
	});

	// Build set of predicted period day strings
	const predictedDays = $derived(() => {
		const days = new Set<string>();
		if (!periodLogs.length) return days;

		// Find the most recent period start
		const sorted = [...periodLogs].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
		const lastStart = new Date(sorted[0].start_date);

		// Predict next 3 cycles
		for (let cycle = 1; cycle <= 3; cycle++) {
			const predictedStart = new Date(lastStart);
			predictedStart.setDate(predictedStart.getDate() + avgCycleLength * cycle);
			for (let d = 0; d < 5; d++) {
				const day = new Date(predictedStart);
				day.setDate(day.getDate() + d);
				const key = day.toISOString().split('T')[0];
				if (!periodDays().has(key)) {
					days.add(key);
				}
			}
		}
		return days;
	});

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}

	function formatDate(day: number): string {
		return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	function getDayStatus(day: number): 'active' | 'predicted' | 'today' | 'none' {
		const dateStr = formatDate(day);
		const today = new Date().toISOString().split('T')[0];
		if (periodDays().has(dateStr)) return 'active';
		if (predictedDays().has(dateStr)) return 'predicted';
		if (dateStr === today) return 'today';
		return 'none';
	}

	const flowLabels = ['', 'Light', 'Light-Med', 'Medium', 'Med-Heavy', 'Heavy'];
</script>

<div class="rounded-2xl p-6" style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card);">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<button
			onclick={prevMonth}
			class="w-9 h-9 rounded-xl flex items-center justify-center text-lg cursor-pointer transition-all hover:scale-110"
			style="background: var(--color-saheli-secondary-1); color: var(--color-saheli-primary);"
		>
			←
		</button>
		<h2 class="text-lg font-semibold" style="color: var(--color-saheli-text);">
			{monthNames[currentMonth]} {currentYear}
		</h2>
		<button
			onclick={nextMonth}
			class="w-9 h-9 rounded-xl flex items-center justify-center text-lg cursor-pointer transition-all hover:scale-110"
			style="background: var(--color-saheli-secondary-1); color: var(--color-saheli-primary);"
		>
			→
		</button>
	</div>

	<!-- Day Names -->
	<div class="grid grid-cols-7 gap-1 mb-2">
		{#each dayNames as name}
			<div class="text-center text-xs font-medium py-2" style="color: var(--color-saheli-muted);">{name}</div>
		{/each}
	</div>

	<!-- Calendar Grid -->
	<div class="grid grid-cols-7 gap-1">
		<!-- Empty cells for offset -->
		{#each Array(firstDayOfWeek) as _}
			<div></div>
		{/each}

		{#each Array(daysInMonth) as _, i}
			{@const day = i + 1}
			{@const status = getDayStatus(day)}
			<button
				onclick={() => onLogPeriod?.(formatDate(day))}
				class="aspect-square rounded-xl flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 relative"
				style="
					background: {status === 'active' ? 'linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent))' :
						status === 'predicted' ? 'var(--color-saheli-secondary-2)' :
						status === 'today' ? 'var(--color-saheli-secondary-1)' : 'transparent'};
					color: {status === 'active' ? 'white' :
						status === 'predicted' ? 'var(--color-saheli-accent)' :
						status === 'today' ? 'white' : 'var(--color-saheli-text)'};
					box-shadow: {status === 'active' ? 'var(--shadow-glow)' : 'none'};
				"
			>
				{day}
				{#if status === 'predicted'}
					<span class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style="background: var(--color-saheli-primary);"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Legend -->
	<div class="flex items-center gap-4 mt-6 pt-4 border-t" style="border-color: var(--color-saheli-border);">
		<div class="flex items-center gap-2">
			<span class="w-3 h-3 rounded-full" style="background: var(--color-saheli-primary);"></span>
			<span class="text-xs" style="color: var(--color-saheli-muted);">Period</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-3 h-3 rounded-full" style="background: var(--color-saheli-secondary-2); border: 1px solid var(--color-saheli-border);"></span>
			<span class="text-xs" style="color: var(--color-saheli-muted);">Predicted</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-3 h-3 rounded-full" style="background: var(--color-saheli-secondary-1); border: 1px solid var(--color-saheli-border);"></span>
			<span class="text-xs" style="color: var(--color-saheli-muted);">Today</span>
		</div>
	</div>
</div>
