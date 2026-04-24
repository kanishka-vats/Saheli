<script lang="ts">
  import { onMount, untrack } from "svelte";
  import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
  import CalendarIcon from "$lib/components/icons/CalendarIcon.svelte";
  import MoodIcon from "$lib/components/icons/MoodIcon.svelte";
  import MicIcon from "$lib/components/icons/MicIcon.svelte";
  import VoiceAssistant from "$lib/components/VoiceAssistant.svelte";
  import { createSupabaseBrowserClient } from "$lib/supabase/client";
  import { goto, invalidateAll } from "$app/navigation";
  import { enhance } from "$app/forms";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { z } from "zod";
  import { profileSchema } from "$lib/schemas";

  let { data, form } = $props();
  const supabase = createSupabaseBrowserClient();

  // Simple state for typewriter greeting
  const greetingName = $derived(
    data.profile?.username ||
      data.profile?.display_name ||
      data.display_name_fallback ||
      "SAHELI",
  );
  const fullGreeting = $derived(`HELLO, ${greetingName.toUpperCase()}.`);
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
  let newUsername = $state("");
  let avgCycleLength = $state(28);
  let periodLength = $state(5);

  $effect(() => {
    if (data.profile) {
      newUsername = data.profile.username || data.profile.display_name || "";
      avgCycleLength = data.profile.avg_cycle_length || 28;
      periodLength = data.profile.period_length || 5;
    }
  });

  let saving = $state(false);
  let saveStatus = $state<"success" | "error" | null>(null);
  let errorMessage = $state("");
  let deleteStatus = $state<"idle" | "deleting" | "success" | "error">("idle");

  async function updateProfile() {
    if (saving) return;
    saving = true;
    saveStatus = null;
    errorMessage = "";

    const userId = data.session?.user?.id || data.user?.id;
    if (!userId) {
      if (data.isGuest) {
        document.cookie = `saheli_display_name=${newUsername.trim()}; path=/; max-age=31536000`;
        saveStatus = "success";
        await invalidateAll();
        setTimeout(() => {
          showSettings = false;
          saveStatus = null;
        }, 1500);
      } else {
        saveStatus = "error";
        errorMessage = "User session not found.";
      }
      saving = false;
      return;
    }

    try {
      const validated = profileSchema.parse({
        username: newUsername.trim(),
        avgCycleLength: Number(avgCycleLength),
        periodLength: Number(periodLength),
      });

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        username: validated.username,
        display_name: validated.username,
        avg_cycle_length: validated.avgCycleLength,
      });

      if (!error) {
        saveStatus = "success";
        await invalidateAll();
        setTimeout(() => {
          showSettings = false;
          saveStatus = null;
        }, 1500);
      } else {
        console.error("Profile save error:", error);
        saveStatus = "error";
        errorMessage = error.message;
      }
    } catch (err: any) {
      console.error("Save error:", err);
      saveStatus = "error";
      errorMessage = err.message || "Failed to save.";
    }
    saving = false;
  }

  const enhanceDeleteAccount: SubmitFunction = () => {
    deleteStatus = "deleting";
    errorMessage = "";

    return async ({ result }) => {
      if (result.type === "redirect") {
        deleteStatus = "success";
        await new Promise((resolve) => setTimeout(resolve, 900));
        await goto(result.location, { replaceState: true });
        return;
      }

      if (result.type === "failure") {
        deleteStatus = "error";
        errorMessage = result.data?.message || "Failed to delete account.";
        return;
      }

      deleteStatus = "error";
      errorMessage = "Failed to delete account.";
    };
  };
</script>

<div class="flex flex-col gap-6 lg:gap-8 pb-10">
  <!-- Header -->
  <header
    class="flex items-center gap-2 border-b-2 border-(--color-saheli-border) pb-1.5 shrink-0 w-full"
  >
    <div class="min-w-0 flex-1 overflow-hidden">
      <h1
        class="text-lg md:text-xl lg:text-2xl font-black leading-tight tracking-tight truncate w-full"
      >
        {greeting}<span class="animate-pulse">_</span>
      </h1>
    </div>
    <div class="shrink-0 ml-auto">
      <button
        onclick={() => (showSettings = true)}
        class="brutal-btn bg-[--color-saheli-yellow] text-[9px] md:text-[10px] px-2.5! py-1.5! tracking-wide"
        aria-label="Open Settings"
      >
        SETTINGS
      </button>
    </div>
  </header>

  <!-- Quick Stats Grid -->
  <section
    class="brutal-card no-card-shift border-2 border-(--color-saheli-border) overflow-hidden shrink-0 shadow-[0_20px_42px_rgba(186,120,146,0.32)]"
    style="background: color-mix(in oklab, var(--color-saheli-secondary, var(--color-saheli-yellow)) 52%, var(--color-saheli-surface) 48%);"
  >
    <div class="h-[360px] md:h-[420px] lg:h-[500px] p-3 md:p-4">
      <VoiceAssistant
        chatHistory={[]}
        languagePref={data.profile?.language_pref || "en"}
        isGuest={data.isGuest}
      />
    </div>
  </section>

  <!-- Quick Stats Grid -->
  <div
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 shrink-0"
  >
    <!-- Period Card -->
    <div
      class="brutal-card no-card-shift p-4 bg-[--color-saheli-primary] text-[--color-saheli-text] flex flex-col justify-between h-full overflow-hidden"
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
          class="text-3xl lg:text-5xl font-black mb-1 lg:mb-2 tracking-tighter text-[--color-saheli-text]"
        >
          DAY {cycleDay}
        </h2>
        <p class="text-[10px] font-black opacity-60 mb-2 uppercase text-[--color-saheli-text]">day- {cycleDay}</p>
        <p
          class="text-sm lg:text-lg font-black border-t-2 border-(--color-saheli-border) pt-2 uppercase text-[--color-saheli-text]"
        >
          {cycleStatus}
        </p>
      </div>
      <a
        href="/dashboard/calendar"
        class="brutal-btn bg-(--color-saheli-primary) text-(--color-saheli-bg) mt-4 lg:mt-6 w-full py-2.5! text-center text-xs"
        >LOG PERIOD</a
      >
    </div>

    <!-- Mood Card -->
    <div
      class="brutal-card no-card-shift p-4 bg-[--color-saheli-yellow] text-[--color-saheli-text] flex flex-col justify-between h-full overflow-hidden"
    >
      <div>
        <div class="flex items-center justify-between mb-2 lg:mb-4">
          <MoodIcon class="w-6 h-6 lg:w-8 lg:h-8 text-[--color-saheli-text]" />
          <span
            class="font-black text-[10px] md:text-xs uppercase text-[--color-saheli-text]"
            >MOOD</span
          >
        </div>
        <h2
          class="text-3xl lg:text-5xl font-black mb-1 lg:mb-2 uppercase tracking-tighter text-[--color-saheli-text]"
        >
          STABLE
        </h2>
        <p class="text-[10px] font-black opacity-60 mb-2 uppercase text-[--color-saheli-text]">log your mood now</p>
        <p
          class="text-sm lg:text-base font-bold opacity-80 uppercase text-[--color-saheli-text]"
        >
          LOG FEELINGS NOW.
        </p>
      </div>
      <a
        href="/dashboard/mood"
        class="brutal-btn bg-(--color-saheli-primary) text-(--color-saheli-bg) mt-4 lg:mt-6 w-full py-2.5! text-center text-xs"
        >LOG MOOD</a
      >
    </div>

    <!-- AI Assistant Card -->
    <div
      class="brutal-card no-card-shift p-4 bg-(--color-saheli-surface) text-[--color-saheli-text] flex flex-col justify-between h-full sm:col-span-2 lg:col-span-1 border-b-8 border-r-8 border-(--color-saheli-border) overflow-hidden"
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
          class="text-2xl lg:text-4xl font-black mb-1 lg:mb-2 uppercase tracking-tighter text-[--color-saheli-text]"
        >
          AI READY.
        </h2>
        <p class="text-[10px] font-black opacity-60 mb-2 uppercase text-[--color-saheli-text]">ask anything for ai assistant</p>
        <p
          class="text-[10px] font-bold uppercase opacity-60 text-[--color-saheli-text]"
        >
          ASK ANYTHING IN HINGLISH.
        </p>
      </div>
      <a
        href="/dashboard/assistant"
        class="brutal-btn bg-(--color-saheli-primary) text-(--color-saheli-bg) mt-4 lg:mt-6 w-full py-2.5! text-center text-xs"
        >START CHAT →</a
      >
    </div>
  </div>

  <!-- Recent Logs -->
  <section class="flex flex-col gap-4">
    <h3
      class="text-xl font-black tracking-tight uppercase text-(--color-saheli-text) shrink-0"
    >
      HISTORY
    </h3>
    <div class="space-y-3 pr-2 pb-4">
      {#each data.moodLogs.slice(0, 3) as log, i}
        <div
          class="brutal-card no-card-shift p-3 md:p-5 bg-(--color-saheli-surface) flex items-center justify-between border-2 border-(--color-saheli-border)"
        >
          <div class="flex items-center gap-3 md:gap-6">
            <div
              class="w-8 h-8 md:w-12 md:h-12 bg-(--color-saheli-yellow) border-2 border-(--color-saheli-border) flex items-center justify-center font-black text-sm"
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
          class="brutal-card no-card-shift p-8 bg-(--color-saheli-surface) text-center border-2 border-dashed border-(--color-saheli-border)"
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
    class="fixed inset-0 bg-(--color-saheli-text)/80 flex items-center justify-center p-4 z-100 backdrop-blur-sm"
  >
    <div
      class="brutal-card no-card-shift p-8 bg-(--color-saheli-surface) max-w-md w-full space-y-6 animate-brutal-up border-4 border-(--color-saheli-border) relative"
    >
      <button
        type="button"
        onclick={() => (showSettings = false)}
        class="absolute top-4 right-4 w-10 h-10 border-4 border-(--color-saheli-border) bg-(--color-saheli-accent) text-(--color-saheli-bg) flex items-center justify-center font-black text-2xl"
        aria-label="Close Settings"
      >
        ×
      </button>
      <h3 class="text-3xl font-black text-(--color-saheli-text)">SETTINGS</h3>
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div>
          <label
            class="block font-black mb-1 text-[10px] uppercase tracking-widest text-(--color-saheli-text)"
            for="username-input">USERNAME</label
          >
          <input
            id="username-input"
            type="text"
            bind:value={newUsername}
            class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-(--color-saheli-text) outline-none transition-colors"
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
              class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-(--color-saheli-text) outline-none transition-colors"
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
              class="w-full border-4 border-(--color-saheli-border) p-3 font-black text-lg bg-(--color-saheli-bg) text-(--color-saheli-text) focus:bg-(--color-saheli-yellow) focus:text-(--color-saheli-text) outline-none transition-colors"
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
          ? 'bg-(--color-saheli-yellow)'
          : saveStatus === 'error'
            ? 'bg-(--color-saheli-accent)'
            : 'bg-(--color-saheli-primary)'} py-4! text-lg! disabled:opacity-50"
      >
        {#if saving}
          SAVING...
        {:else if saveStatus === "success"}
          SUCCESS! ✔
        {:else if saveStatus === "error"}
          {errorMessage || "ERROR! [×]"}
        {:else}
          SAVE CHANGES
        {/if}
      </button>
      <form
        method="POST"
        action="?/deleteAccount"
        use:enhance={enhanceDeleteAccount}
        onsubmit={(e: SubmitEvent) => {
          if (
            !confirm(
              "DELETE YOUR ACCOUNT PERMANENTLY? THIS CANNOT BE UNDONE.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={deleteStatus === "deleting"}
          class="brutal-btn w-full bg-(--color-saheli-accent)! text-(--color-saheli-bg)! py-3! text-sm"
        >
          {deleteStatus === "deleting" ? "DELETING ACCOUNT..." : "DELETE ACCOUNT"}
        </button>
      </form>
      {#if deleteStatus === "success"}
        <p class="text-[10px] text-(--color-saheli-primary) font-bold uppercase text-center mt-2">
          ACCOUNT DELETED. REDIRECTING TO LOGIN...
        </p>
      {/if}
      {#if errorMessage}
        <p
          class="text-[10px] text-(--color-saheli-accent) font-bold uppercase text-center mt-2"
        >
          {errorMessage}
        </p>
      {/if}
      {#if form?.message}
        <p
          class="text-[10px] text-(--color-saheli-accent) font-bold uppercase text-center mt-2"
        >
          {form.message}
        </p>
      {/if}
    </div>
  </div>
{/if}
