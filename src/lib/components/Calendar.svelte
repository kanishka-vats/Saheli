<script lang="ts">
  type PeriodLog = {
    id: string;
    start_date: string;
    end_date: string | null;
    flow_intensity: number;
  };

  let {
    periodLogs = [],
    avgCycleLength = 28,
    periodLength = 5,
    onLogPeriod
  }: {
    periodLogs: PeriodLog[];
    avgCycleLength: number;
    periodLength: number;
    onLogPeriod?: (date: string) => void;
  } = $props();

  let currentMonth = $state(new Date().getMonth());
  let currentYear = $state(new Date().getFullYear());
  let flipDirection = $state<'next' | 'prev' | null>(null);

  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
  const firstDayOfWeek = $derived(new Date(currentYear, currentMonth, 1).getDay());

  const periodDays = $derived(() => {
    const days = new Set<string>();
    const exclusions = new Set<string>();

    // First collect exclusions (intensity 0)
    for (const log of periodLogs) {
      if (Number(log.flow_intensity) === 0) {
        exclusions.add(new Date(log.start_date).toISOString().split('T')[0]);
      }
    }

    for (const log of periodLogs) {
      const intensity = Number(log.flow_intensity);
      if (isNaN(intensity) || intensity === 0) continue; 
      const start = new Date(log.start_date);
      const end = log.end_date ? new Date(log.end_date) : new Date(start.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000);
      let cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().split('T')[0];
        if (!exclusions.has(key)) {
          days.add(key);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return days;
  });

  const predictedDays = $derived(() => {
    const days = new Set<string>();
    if (!periodLogs.length) return days;
    const sorted = [...periodLogs]
      .filter(l => Number(l.flow_intensity) > 0)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    
    if (!sorted.length) return days;

    const lastStart = new Date(sorted[0].start_date);
    for (let cycle = 1; cycle <= 3; cycle++) {
      const predictedStart = new Date(lastStart);
      predictedStart.setDate(predictedStart.getDate() + avgCycleLength * cycle);
      for (let d = 0; d < periodLength; d++) {
        const day = new Date(predictedStart);
        day.setDate(day.getDate() + d);
        const key = day.toISOString().split('T')[0];
        if (!periodDays().has(key)) { days.add(key); }
      }
    }
    return days;
  });

  function prevMonth() {
    flipDirection = 'prev';
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else { currentMonth--; }
    setTimeout(() => flipDirection = null, 200);
  }

  function nextMonth() {
    flipDirection = 'next';
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else { currentMonth++; }
    setTimeout(() => flipDirection = null, 200);
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
</script>

<div class="brutal-card no-card-shift p-6 bg-(--color-saheli-surface) font-sans">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8 border-b-4 border-(--color-saheli-border) pb-6">
    <button
      onclick={prevMonth}
      class="brutal-btn p-2! bg-(--color-saheli-yellow)"
      aria-label="Previous Month"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <h2 class="text-2xl font-black tracking-tighter text-(--color-saheli-text)">
      {monthNames[currentMonth]} {currentYear}
    </h2>
    <button
      onclick={nextMonth}
      class="brutal-btn p-2! bg-(--color-saheli-yellow)"
      aria-label="Next Month"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  </div>

  <!-- Day Names -->
  <div class="grid grid-cols-7 gap-2 mb-4">
    {#each dayNames as name}
      <div class="text-center text-xs font-black py-2 bg-(--color-saheli-text) text-(--color-saheli-bg)">{name}</div>
    {/each}
  </div>

  <!-- Calendar Grid -->
  <div
    class="grid grid-cols-7 gap-2"
    class:animate-flip-next={flipDirection === 'next'}
    class:animate-flip-prev={flipDirection === 'prev'}
  >
    {#each Array(firstDayOfWeek) as _}
      <div class="aspect-square bg-(--color-saheli-bg) border-2 border-(--color-saheli-border)/10"></div>
    {/each}

    {#each Array(daysInMonth) as _, i}
      {@const day = i + 1}
      {@const status = getDayStatus(day)}
      <button
        onclick={() => onLogPeriod?.(formatDate(day))}
        class="aspect-square border-4 border-(--color-saheli-border) font-black text-xl flex items-center justify-center transition-all duration-100 {status === 'active' ? 'bg-(--color-saheli-accent) text-(--color-saheli-bg) shadow-brutal translate-x-0.5 translate-y-0.5' : 
               status === 'predicted' ? 'bg-(--color-saheli-surface) border-dashed text-(--color-saheli-text)' : 
               status === 'today' ? 'bg-(--color-saheli-yellow) text-(--color-saheli-text)' : 'bg-(--color-saheli-surface) text-(--color-saheli-text) hover:bg-(--color-saheli-bg)'}"
      >
        {day}
      </button>
    {/each}
  </div>

  <!-- Legend -->
  <div class="grid grid-cols-3 gap-4 mt-8 pt-8 border-t-4 border-(--color-saheli-border)">
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 border-4 border-(--color-saheli-border) bg-(--color-saheli-accent)"></div>
      <span class="text-xs font-black uppercase text-(--color-saheli-text)">PERIOD</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 border-4 border-(--color-saheli-border) border-dashed bg-(--color-saheli-surface)"></div>
      <span class="text-xs font-black uppercase text-(--color-saheli-text)">PREDICTED</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 border-4 border-(--color-saheli-border) bg-(--color-saheli-yellow)"></div>
      <span class="text-xs font-black uppercase text-(--color-saheli-text)">TODAY</span>
    </div>
  </div>
</div>

<style>
  @keyframes flip-in {
    from { opacity: 0; transform: scale(0.98) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-flip-next { animation: flip-in 0.2s steps(4) both; }
  .animate-flip-prev { animation: flip-in 0.2s steps(4) both; }
</style>
