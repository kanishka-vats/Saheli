<script lang="ts">
  import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
  import CalendarIcon from "$lib/components/icons/CalendarIcon.svelte";
  import MoodIcon from "$lib/components/icons/MoodIcon.svelte";
  import MicIcon from "$lib/components/icons/MicIcon.svelte";
  import { onMount } from "svelte";

  let { data } = $props();
  let isDark = $state(false); // Default to light

  const heroText = "HEALTH COMPANION";
  let typed = $state("");
  let typingDone = $state(false);

  onMount(() => {
    // Theme logic
    const storedTheme = localStorage.theme;
    if (storedTheme === "dark") {
      isDark = true;
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      isDark = false;
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.theme = "light";
    }

    // Typewriter effect (snappy brutalist style)
    let i = 0;
    const interval = setInterval(() => {
      if (i < heroText.length) {
        typed = heroText.slice(0, ++i);
      } else {
        typingDone = true;
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  });

  function toggleTheme() {
    isDark = !isDark;
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.theme = theme;
  }
</script>

<svelte:head>
  <title>SAHELI — BRUTAL HEALTH</title>
</svelte:head>

<div class="min-h-dvh flex flex-col bg-(--color-saheli-bg)">
  <!-- ── Marquee ── -->
  <div class="marquee">
    <div class="marquee-content">
      TRACK YOUR PERIOD • LOG YOUR MOOD • TALK TO SAHELI • NO CRAP • JUST REAL TALK •
      TRACK YOUR PERIOD • LOG YOUR MOOD • TALK TO SAHELI • NO CRAP • JUST REAL TALK •
    </div>
  </div>

  <!-- ── Nav ── -->
  <nav
    class="flex items-center justify-between px-4 md:px-6 py-2 border-b-1.5 border-(--color-saheli-border) bg-(--color-saheli-surface) sticky top-0 z-40"
  >
    <div class="flex items-center gap-2">
      <SaheliLogoIcon
        class="w-7 h-7 md:w-9 md:h-9 text-(--color-saheli-text)"
      />
      <span
        class="text-xl md:text-2xl font-black tracking-tighter text-(--color-saheli-text)"
        >SAHELI</span
      >
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={toggleTheme}
        class="brutal-btn p-1! bg-(--color-saheli-yellow)"
        aria-label="Toggle Theme"
      >
        {#if isDark}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            ></path></svg
          >
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            ><circle cx="12" cy="12" r="5" /><line
              x1="12"
              y1="1"
              x2="12"
              y2="3"
            /><line x1="12" y1="21" x2="12" y2="23" /></svg
          >
        {/if}
      </button>

      {#if data.session}
        <a
          href="/dashboard"
          class="brutal-btn bg-(--color-saheli-text) text-(--color-saheli-bg) text-[10px] md:text-xs"
          >DASHBOARD</a
        >
      {:else}
        <a
          href="/login"
          class="brutal-btn bg-(--color-saheli-text) text-(--color-saheli-bg) text-[10px] md:text-xs"
          >LOGIN</a
        >
      {/if}
    </div>
  </nav>

  <!-- ── Hero ── -->
  <main
    class="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full"
  >
    <div class="flex-1 text-center lg:text-left space-y-4 md:space-y-6">
      <div
        class="inline-block px-2 py-0.5 bg-black text-white font-black text-[9px] md:text-xs uppercase tracking-widest"
      >
        2026 EDITION
      </div>

      <h1
        class="text-4xl md:text-6xl lg:text-8xl font-black leading-none tracking-tighter text-(--color-saheli-text)"
      >
        YOUR CYCLE.<br />
        <span class="text-(--color-saheli-primary)">{typed}</span><span
          class="animate-pulse">_</span
        >
      </h1>

      <p
        class="text-base md:text-xl font-bold leading-tight max-w-lg mx-auto lg:mx-0 text-(--color-saheli-text)"
      >
        Track periods, log moods, and talk to an AI assistant. Simple. Bold.
        Brutal.
      </p>

      <div
        class="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-5"
      >
        <a
          href={data.session ? "/dashboard" : "/login"}
          class="brutal-btn text-lg! md:text-xl! px-6! md:px-10! py-3! md:py-4! bg-(--color-saheli-primary)"
        >
          {data.session ? "GO TO DASHBOARD 💥" : "LET'S GO 💥"}
        </a>
      </div>
    </div>

    <!-- Brutalist Card Grid -->
    <div
      class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:rotate-1"
    >
      <div
        class="brutal-card p-4 bg-(--color-saheli-yellow) sm:-rotate-1 hover:rotate-0 transition-transform"
      >
        <CalendarIcon class="w-8 h-8 mb-3" />
        <h3 class="text-lg font-black mb-1 text-black">CALENDAR</h3>
        <p class="font-bold text-[10px] uppercase opacity-70">
          NO FLUFF. JUST DATES.
        </p>
      </div>

      <div
        class="brutal-card p-4 bg-black text-white sm:rotate-1 hover:rotate-0 transition-transform"
      >
        <MoodIcon class="w-8 h-8 mb-3 text-black" />
        <h3 class="text-lg font-black mb-1">MOOD</h3>
        <p class="font-bold text-[10px] uppercase opacity-70">
          HOW DO YOU FEEL?
        </p>
      </div>

      <div
        class="brutal-card p-4 bg-(--color-saheli-surface) sm:col-span-2 border-b-6 border-(--color-saheli-border)"
      >
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div
            class="w-10 h-10 bg-(--color-saheli-primary) border-2 border-black flex items-center justify-center"
          >
            <MicIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-black text-(--color-saheli-text)">
              AI ASSISTANT
            </h3>
            <p class="font-bold text-[10px] uppercase opacity-70">
              HINDI • ENGLISH • HINGLISH
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer Marquee -->
  <div class="marquee bg-black text-white mt-auto">
    <div class="marquee-content" style="animation-duration: 10s;">
      SAHELI • SAHELI • SAHELI • SAHELI • SAHELI • SAHELI • SAHELI • SAHELI •
      SAHELI • SAHELI • SAHELI • SAHELI •
    </div>
  </div>
</div>

<style>
  .marquee {
    white-space: nowrap;
    overflow: hidden;
    border-top: 4px solid #000000;
    border-bottom: 4px solid #000000;
    background: var(--color-saheli-primary);
    padding: 0.75rem 0;
    z-index: 10;
  }

  .marquee-content {
    display: inline-block;
    animation: marquee 30s linear infinite;
    font-size: 1.5rem;
    font-weight: 900;
    text-transform: uppercase;
    padding-left: 100%;
  }

  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }
</style>
