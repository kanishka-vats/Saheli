<script lang="ts">
  import Calendar from '$lib/components/Calendar.svelte';
  import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
  import { invalidateAll } from '$app/navigation';
  import { createSupabaseBrowserClient } from '$lib/supabase/client';

  import { guestPeriodLogs } from '$lib/stores/guestStore.svelte';
  
  let { data } = $props();
  const supabase = createSupabaseBrowserClient();

  const periodLogs = $derived(data.session ? data.periodLogs : [...guestPeriodLogs.value, ...data.periodLogs]);

  let startDate = $state('');
  let showModal = $state(false);
  let flowIntensity = $state(3);
  let saving = $state(false);

  function handleLogPeriod(date: string) {
    startDate = date;
    // Check if there's already a log for this date to pre-fill
    const existing = periodLogs.find(l => l.start_date === date);
    flowIntensity = existing ? Number(existing.flow_intensity) : 3;
    showModal = true;
  }

  function closeModal() { showModal = false; }

  async function savePeriodLog() {
    if (!startDate || saving) return;
    saving = true;

    if (!data.session) {
      // Guest mode
      const filtered = guestPeriodLogs.value.filter(l => l.start_date !== startDate);
      guestPeriodLogs.value = [...filtered, {
        id: Math.random().toString(36).substr(2, 9),
        start_date: startDate,
        end_date: null,
        flow_intensity: flowIntensity
      }];
      saving = false; closeModal();
      return;
    }

    const { data: existing } = await supabase
      .from('period_logs').select('id')
      .eq('user_id', data.user?.id).eq('start_date', startDate).maybeSingle();

    if (existing) {
      // If intensity is 0, we could delete it, but the new logic uses 0 as exclusion.
      // So let's just update it.
      await supabase.from('period_logs').update({ flow_intensity: flowIntensity }).eq('id', existing.id);
    } else {
      await supabase.from('period_logs').insert({
        user_id: data.user?.id, start_date: startDate,
        end_date: null, flow_intensity: flowIntensity
      });
    }
    saving = false; closeModal(); await invalidateAll();
  }
</script>

<svelte:head>
  <title>CALENDAR — SAHELI</title>
</svelte:head>

<div class="max-w-3xl mx-auto flex flex-col gap-6 lg:h-[calc(100dvh-4rem)]">
  <header class="border-b-4 md:border-b-8 border-(--color-saheli-border) pb-4 md:pb-8 shrink-0">
    <div class="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
      <div class="w-12 h-12 md:w-16 md:h-16 bg-(--color-saheli-primary) text-(--color-saheli-bg) flex items-center justify-center border-2 md:border-4 border-(--color-saheli-border) shadow-brutal">
        <CalendarIcon class="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <h1 class="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase">CALENDAR</h1>
    </div>
    <p class="text-sm md:text-xl lg:text-2xl font-bold uppercase tracking-tight">TRACK YOUR CYCLE • SEE PREDICTIONS • LOG DATA</p>
  </header>

  <div class="flex-1 min-h-0 overflow-y-auto pr-2 pb-4">
    <Calendar
      periodLogs={periodLogs}
      avgCycleLength={data.profile?.avg_cycle_length ?? 28}
      periodLength={data.profile?.period_length ?? 5}
      onLogPeriod={handleLogPeriod}
    />
  </div>
</div>

<!-- Log Period Modal -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-(--color-saheli-text)/80 backdrop-blur-sm animate-fade-in"
    onclick={closeModal}
  >
    <div
      class="w-full max-w-lg brutal-card bg-(--color-saheli-surface) p-10 cursor-auto text-left"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 id="modal-title" class="text-4xl font-black mb-8 border-b-4 border-(--color-saheli-border) pb-4 uppercase">
        LOGGING: {startDate}
      </h3>

      <div class="mb-10">
        <label for="flow-intensity" class="block text-sm font-black uppercase mb-4">
          FLOW INTENSITY: <span class="text-3xl text-(--color-saheli-primary)">{flowIntensity}/5</span>
        </label>
        <div class="relative h-12 flex items-center">
          <input
            id="flow-intensity" type="range" min="0" max="5" step="1"
            bind:value={flowIntensity}
            class="w-full h-4 bg-(--color-saheli-primary) appearance-none cursor-pointer border-4 border-(--color-saheli-border)"
          />
        </div>
        <div class="flex justify-between font-black text-xs mt-2 uppercase">
          <span>NONE (0)</span><span>HEAVY (5)</span>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="button" onclick={closeModal} class="brutal-btn flex-1 bg-(--color-saheli-surface) text-(--color-saheli-text) py-4!">CANCEL</button>
        <button type="button" onclick={savePeriodLog} disabled={saving} class="brutal-btn flex-1 bg-(--color-saheli-primary) text-(--color-saheli-bg) py-4! disabled:opacity-50">
          {saving ? 'SAVING...' : 'CONFIRM LOG'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>


  input[type=range]::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 32px;
    background: var(--color-saheli-primary);
    border: 4px solid var(--color-saheli-border);
    cursor: pointer;
  }
</style>
