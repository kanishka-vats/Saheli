<script lang="ts">
  import { onMount, untrack } from "svelte";
  import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
  import CalendarIcon from "$lib/components/icons/CalendarIcon.svelte";
  import MoodIcon from "$lib/components/icons/MoodIcon.svelte";
  import MicIcon from "$lib/components/icons/MicIcon.svelte";
  import { createSupabaseBrowserClient } from "$lib/supabase/client";
  import { invalidateAll } from "$app/navigation";
  import { z } from "zod";
  import { profileSchema } from "$lib/schemas";

  let { data } = $props();
  const supabase = createSupabaseBrowserClient();

  // Simple state for typewriter greeting
  const profile = $derived(data.profile);
  const fullGreeting = $derived(
    profile?.display_name
      ? `HELLO, ${profile.display_name.toUpperCase()}.`
      : "HELLO, SAHELI.",
  );
  let greeting = $state("");

  $effect(() => {
    // Reset and re-run typewriter whenever fullGreeting changes
    greeting = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullGreeting.length) {
        greeting = fullGreeting.slice(0, ++i);
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  });

  // Calculate cycle day (mock logic for demo)
  const cycleDay = 14;
  const cycleStatus = "OVULATION PHASE";

  let showSettings = $state(false);
  let newDisplayName = $state("");
  let avgCycleLength = $state(28);
  let periodLength = $state(5);

  $effect(() => {
    if (data.profile) {
      newDisplayName = data.profile.display_name || "";
      avgCycleLength = data.profile.avg_cycle_length || 28;
      periodLength = data.profile.period_length || 5;
    }
  });
  let saving = $state(false);
  let saveStatus = $state<"success" | "error" | null>(null);
  let errorMessage = $state("");

  async function updateProfile() {
    if (saving) return;
    saving = true;
    saveStatus = null;

    const userId = data.session?.user?.id || data.user?.id;
    
    if (!userId) {
      if (data.isGuest) {
        document.cookie = `saheli_display_name=${newDisplayName.trim()}; path=/; max-age=31536000`;
        saveStatus = "success";
        await invalidateAll();
        setTimeout(() => { showSettings = false; saveStatus = null; }, 1500);
      } else {
        saveStatus = "error";
      }
      saving = false;
      return;
    }

    try {
      const validated = profileSchema.parse({
        display_name: newDisplayName.trim(),
        avgCycleLength: Number(avgCycleLength),
        periodLength: Number(periodLength)
      });

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          display_name: validated.display_name,
          avg_cycle_length: validated.avgCycleLength
        });

      if (!error) {
        saveStatus = "success";
        await invalidateAll();
        setTimeout(() => {
          showSettings = false;
          saveStatus = null;
          errorMessage = "";
        }, 1500);
      } else {
        console.error("Profile save error:", error);
        saveStatus = "error";
        errorMessage = error.message;
      }
    } catch (err: any) {
      console.error("Unknown error:", err);
      saveStatus = "error";
      errorMessage = err.message || "Unknown error";
    }
    saving = false;
  }
</script>

<div class="flex flex-col gap-6 lg:h-[calc(100dvh-4rem)]">
  <!-- Header -->
  <header
    class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-4 border-(--color-saheli-border) pb-4 shrink-0"
  >
    <div class="min-w-0 flex-1">
      <div
        class="inline-block px-2 py-0.5 bg-black text-white font-black text-[10px] uppercase tracking-widest mb-2"
      >
        STATUS: ACTIVE
      </div>
      <h1
        class="text-2xl md:text-4xl lg:text-5xl font-black leading-none tracking-tighter truncate w-full"
      >
        {greeting}<span class="animate-pulse">_</span>
      </h1>
    </div>
    <div class="flex gap-3">
      <button
        onclick={() => (showSettings = true)}
        class="brutal-btn bg-[--color-saheli-yellow] text-xs md:text-sm"
        aria-label="Open Settings"
      >
        SETTINGS
      </button>
    </div>
  </header>

  <!-- Quick Stats Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0 lg:shrink lg:flex-1 lg:min-h-0">
    <!-- Period Card -->
    <div
      class="brutal-card p-4 bg-[--color-saheli-primary] text-[--color-saheli-text] flex flex-col justify-between h-full overflow-hidden"
    >
      <div>
        <div class="flex items-center justify-between mb-2 lg:mb-4">
          <CalendarIcon
            class="w-6 h-6 lg:w-8 lg:h-8 text-[--color-saheli-text]"
          />
          <span
            class="font-black text-[10px] md:text-xs uppercase text-[--color-saheli-text]"
            >PERIOD</span
          >
        </div>
        <h2
          class="text-3xl lg:text-5xl font-black mb-2 tracking-tighter text-[--color-saheli-text]"
        >
          DAY {cycleDay}
        </h2>
        <p
          class="text-sm lg:text-lg font-black border-t-2 border-black pt-2 uppercase text-[--color-saheli-text]"
        >
          {cycleStatus}
        </p>
      </div>
      <a
        href="/dashboard/calendar"
        class="brutal-btn bg-black text-[--color-saheli-text] mt-4 w-full py-2! text-center text-xs"
        >LOG PERIOD</a
      >
    </div>

    <!-- Mood Card -->
    <div
      class="brutal-card p-4 bg-[--color-saheli-yellow] text-[--color-saheli-text] flex flex-col justify-between h-full overflow-hidden"
    >
      <div>
        <div class="flex items-center justify-between mb-2 lg:mb-4">
          <MoodIcon
            class="w-6 h-6 lg:w-8 lg:h-8 text-[--color-saheli-text]"
          />
          <span
            class="font-black text-[10px] md:text-xs uppercase text-[--color-saheli-text]"
            >MOOD</span
          >
        </div>
        <h2
          class="text-3xl lg:text-5xl font-black mb-2 uppercase tracking-tighter text-[--color-saheli-text]"
        >
          STABLE
        </h2>
        <p
          class="text-sm lg:text-base font-bold opacity-80 uppercase text-[--color-saheli-text]"
        >
          LOG FEELINGS NOW.
        </p>
      </div>
      <a
        href="/dashboard/mood"
        class="brutal-btn bg-black text-[--color-saheli-text] mt-4 w-full py-2! text-center text-xs"
        >LOG MOOD</a
      >
    </div>

    <!-- AI Assistant Card -->
    <div
      class="brutal-card p-4 bg-white text-[--color-saheli-text] flex flex-col justify-between h-full sm:col-span-2 lg:col-span-1 border-b-8 border-r-8 border-black overflow-hidden"
    >
      <div>
        <div class="flex items-center justify-between mb-2 lg:mb-4">
          <MicIcon class="w-6 h-6 lg:w-8 lg:h-8 text-[--color-saheli-text]" />
          <span
            class="font-black text-[10px] md:text-xs uppercase text-[--color-saheli-text]"
            >AI ASSISTANT</span
          >
        </div>
        <h2
          class="text-2xl lg:text-4xl font-black mb-2 uppercase tracking-tighter text-[--color-saheli-text]"
        >
          AI READY.
        </h2>
        <p
          class="text-[10px] font-bold uppercase opacity-60 text-[--color-saheli-text]"
        >
          ASK ANYTHING IN HINGLISH.
        </p>
      </div>
      <a
        href="/dashboard/assistant"
        class="brutal-btn bg-black text-[--color-saheli-text] mt-4 w-full py-2! text-center text-xs"
        >START CHAT →</a
      >
    </div>
  </div>

  <!-- Recent Logs -->
  <section class="flex flex-col flex-1 shrink-0 lg:shrink min-h-0 gap-4">
    <h3
      class="text-2xl font-black tracking-tight uppercase text-(--color-saheli-text) shrink-0"
    >
      HISTORY
    </h3>
    <div class="space-y-3 overflow-y-auto pr-2 pb-4">
      {#each data.moodLogs.slice(0, 3) as log, i}
        <div
          class="brutal-card p-3 md:p-5 bg-(--color-saheli-surface) flex items-center justify-between border-2 border-(--color-saheli-border)"
        >
          <div class="flex items-center gap-3 md:gap-6">
            <div
              class="w-8 h-8 md:w-12 md:h-12 bg-(--color-saheli-yellow) border-2 border-black flex items-center justify-center font-black text-sm"
            >
              {log.mood_score}
            </div>
            <div>
              <p
                class="text-sm md:text-xl font-black uppercase text-(--color-saheli-text)"
              >
                MOOD LOG
              </p>
              <p class="text-[10px] md:text-xs font-bold opacity-50 uppercase">
                {new Date(log.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <a
            href="/dashboard/mood"
            class="font-black text-[10px] md:text-sm border-b-2 border-(--color-saheli-border) hover:bg-(--color-saheli-text) hover:text-(--color-saheli-bg) px-1 text-(--color-saheli-text)"
            >VIEW</a
          >
        </div>
      {:else}
        <div
          class="brutal-card p-8 bg-(--color-saheli-surface) text-center border-2 border-dashed border-(--color-saheli-border)"
        >
          <p class="font-black opacity-40 uppercase text-(--color-saheli-text)">
            NO LOGS YET. START TRACKING!
          </p>
        </div>
      {/each}
    </div>
  </section>
</div>

{#if showSettings}
  <div
    class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-100 backdrop-blur-sm"
  >
    <div
      class="brutal-card p-8 bg-(--color-saheli-surface) max-w-md w-full space-y-6 animate-brutal-up border-4 border-(--color-saheli-border) relative"
    >
      <button
        onclick={() => (showSettings = false)}
        class="absolute top-4 right-4 w-10 h-10 border-4 border-(--color-saheli-border) bg-red-500 flex items-center justify-center font-black text-2xl hover:translate-x-1 hover:translate-y-1 transition-transform"
        aria-label="Close Settings"
      >
        ×
      </button>
      <h3 class="text-3xl font-black text-(--color-saheli-text)">SETTINGS</h3>
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div>
          <label
            class="block font-black mb-1 text-[10px] uppercase tracking-widest text-(--color-saheli-text)"
            for="username-input">DISPLAY NAME</label
          >
          <input
            id="username-input"
            type="text"
            bind:value={newDisplayName}
            class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-black outline-none transition-colors"
            placeholder="YOUR NAME"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block font-black mb-1 text-[10px] uppercase tracking-widest text-(--color-saheli-text)"
              for="cycle-input">AVG CYCLE</label
            >
            <input
              id="cycle-input"
              type="number"
              bind:value={avgCycleLength}
              class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-black outline-none transition-colors"
              min="20"
              max="45"
            />
          </div>
          <div>
            <label
              class="block font-black mb-1 text-[10px] uppercase tracking-widest text-(--color-saheli-text)"
              for="period-input">PERIOD DAYS</label
            >
            <input
              id="period-input"
              type="number"
              bind:value={periodLength}
              class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-black outline-none transition-colors"
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
      <button
        onclick={updateProfile}
        disabled={saving}
        class="brutal-btn w-full {saveStatus === 'success'
          ? 'bg-green-500'
          : saveStatus === 'error'
            ? 'bg-red-500'
            : 'bg-(--color-saheli-primary)'} py-4! text-lg! disabled:opacity-50"
      >
        {#if saving}
          SAVING...
        {:else if saveStatus === "success"}
          SUCCESS! ✔
        {:else if saveStatus === "error"}
          {errorMessage || 'ERROR! [×]'}
        {:else}
          SAVE CHANGES
        {/if}
      </button>
      {#if errorMessage}
        <p class="text-[10px] text-red-600 font-bold uppercase text-center mt-2">{errorMessage}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes brutal-up {
    from {
      transform: translateY(50px) rotate(5deg);
      opacity: 0;
    }
    to {
      transform: translateY(0) rotate(0);
      opacity: 1;
    }
  }
  .animate-brutal-up {
    animation: brutal-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  }
</style>
