<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { createSupabaseBrowserClient } from '$lib/supabase/client';

  import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
  import MicIcon from '$lib/components/icons/MicIcon.svelte';
  import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
  import MoodIcon from '$lib/components/icons/MoodIcon.svelte';
  import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';
  import VoiceAssistant from '$lib/components/VoiceAssistant.svelte';
  import { onMount } from 'svelte';

  let { data, children } = $props();
  const supabase = createSupabaseBrowserClient();

  let sidebarOpen = $state(false);
  let assistantOpen = $state(false); // For mobile toggle
  let isDark = $state(true); // Default to dark

  onMount(() => {
    const storedTheme = localStorage.theme;
    if (storedTheme === 'light') {
      isDark = false;
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      isDark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.theme = 'dark';
    }
  });

  function toggleTheme() {
    isDark = !isDark;
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.theme = theme;
  }

  const navItems = [
    { href: '/dashboard',           label: 'DASHBOARD',    icon: HomeIcon     },
    { href: '/dashboard/calendar',  label: 'CALENDAR',     icon: CalendarIcon },
    { href: '/dashboard/mood',      label: 'MOODS',        icon: MoodIcon     },
    { href: '/dashboard/assistant', label: 'ASSISTANT',    icon: MicIcon      }
  ];

  const currentPath = $derived($page.url.pathname);

  async function signOut() {
    await supabase.auth.signOut();
    document.cookie = "saheli_guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    goto('/login');
  }
</script>

<div class="min-h-dvh flex flex-col lg:flex-row bg-(--color-saheli-bg) font-sans overflow-x-hidden">

  <!-- ───── Sidebar (Desktop Left) ───── -->
  <aside class="hidden lg:flex flex-col w-64 bg-(--color-saheli-surface) border-r-2 border-(--color-saheli-border) h-screen fixed left-0 top-0 p-5 space-y-6 z-40">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3 mb-4">
      <SaheliLogoIcon class="w-10 h-10 text-(--color-saheli-text)" />
      <span class="text-3xl font-black tracking-tighter text-(--color-saheli-text)">SAHELI</span>
    </a>

    <!-- Nav -->
    <nav class="flex-1 space-y-3">
      {#each navItems as item}
        <a
          href={item.href}
          class="brutal-btn w-full justify-start! gap-4 border-2 {$page.url.pathname === item.href ? 'bg-(--color-saheli-text)! text-(--color-saheli-bg)!' : 'bg-(--color-saheli-surface) text-(--color-saheli-text)'}"
        >
          <item.icon class="w-6 h-6" />
          <span class="font-black text-xs">{item.label}</span>
        </a>
      {/each}
    </nav>

    <!-- User Section -->
    <div class="border-t-2 border-(--color-saheli-border) pt-5 space-y-4">
      <div class="px-2">
        <p class="text-lg font-black truncate text-(--color-saheli-text)">{data.profile?.username || 'USER'}</p>
        <p class="text-[10px] font-bold opacity-50 truncate uppercase text-(--color-saheli-text)">{data.user?.email}</p>
      </div>
      <div class="flex flex-col gap-2">
        {#if data.isGuest}
          <a href="/login" class="brutal-btn w-full bg-black! text-white! py-2! text-[10px] text-center">LOGIN</a>
        {:else}
          <button onclick={signOut} class="brutal-btn w-full bg-black! text-white! py-2! text-[10px]">LOGOUT</button>
        {/if}
        <button onclick={toggleTheme} class="brutal-btn w-full bg-(--color-saheli-yellow)! py-2! text-[10px] text-black!">{isDark ? 'LIGHT' : 'DARK'}</button>
      </div>
    </div>
  </aside>

  <!-- ───── Mobile Header ───── -->
  <div class="lg:hidden flex items-center justify-between px-6 py-4 border-b-4 border-(--color-saheli-border) bg-(--color-saheli-surface) sticky top-0 z-50">
    <button onclick={() => sidebarOpen = !sidebarOpen} class="brutal-btn p-2! bg-(--color-saheli-primary)" aria-label="Menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="flex items-center gap-2">
      <SaheliLogoIcon class="w-8 h-8 text-(--color-saheli-text)" />
      <span class="text-2xl font-black tracking-tighter text-(--color-saheli-text)">SAHELI</span>
    </div>
    {#if currentPath === '/dashboard'}
      <button onclick={() => assistantOpen = !assistantOpen} class="brutal-btn p-2! bg-(--color-saheli-yellow)" aria-label="Assistant">
        <MicIcon class="w-6 h-6" />
      </button>
    {:else}
      <a href="/dashboard/assistant" class="brutal-btn p-2! bg-(--color-saheli-yellow)" aria-label="Assistant">
        <MicIcon class="w-6 h-6" />
      </a>
    {/if}
  </div>

  <!-- Mobile Sidebar (Left) -->
  {#if sidebarOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="lg:hidden fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onclick={() => sidebarOpen = false}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <nav class="w-72 h-full bg-(--color-saheli-surface) border-r-4 border-(--color-saheli-border) p-6 flex flex-col animate-slide-left" onclick={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between mb-8 shrink-0">
          <div class="flex items-center gap-2"><SaheliLogoIcon class="w-8 h-8 text-(--color-saheli-text)" /><span class="text-2xl font-black text-(--color-saheli-text)">SAHELI</span></div>
          <button onclick={() => sidebarOpen = false} class="font-black text-2xl text-(--color-saheli-text)">×</button>
        </div>
        <div class="space-y-6 flex-1 overflow-y-auto">
          {#each navItems as { href, label, icon: Icon }}
            <a {href} onclick={() => sidebarOpen = false} class="brutal-btn w-full justify-start! gap-4 border-2 {$page.url.pathname === href ? 'bg-(--color-saheli-text)! text-(--color-saheli-bg)!' : 'bg-(--color-saheli-surface) text-(--color-saheli-text)'}">
              <Icon class="w-6 h-6" />
              <span class="font-black">{label}</span>
            </a>
          {/each}
        </div>
        <div class="border-t-2 border-(--color-saheli-border) pt-5 mt-auto space-y-4 shrink-0">
          <div class="px-2">
            <p class="text-lg font-black truncate text-(--color-saheli-text)">{data.profile?.username || 'USER'}</p>
            <p class="text-[10px] font-bold opacity-50 truncate uppercase text-(--color-saheli-text)">{data.user?.email}</p>
          </div>
          <div class="flex flex-col gap-2">
            {#if data.isGuest}
              <a href="/login" class="brutal-btn w-full bg-black! text-white! py-2! text-[10px] text-center">LOGIN</a>
            {:else}
              <button onclick={signOut} class="brutal-btn w-full bg-black! text-white! py-2! text-[10px]">LOGOUT</button>
            {/if}
            <button onclick={toggleTheme} class="brutal-btn w-full bg-(--color-saheli-yellow)! py-2! text-[10px] text-black!">{isDark ? 'LIGHT' : 'DARK'}</button>
          </div>
        </div>
      </nav>
    </div>
  {/if}

  <!-- Main Content Area -->
  <main class="flex-1 p-4 md:p-8 min-w-0 bg-(--color-saheli-bg) lg:ml-64 {currentPath === '/dashboard' ? 'xl:mr-96' : ''}">
    <div class="max-w-5xl mx-auto">
      {@render children()}
    </div>
  </main>

  <!-- ───── Sidebar (Desktop Right - Chatbot) ───── -->
  {#if currentPath === '/dashboard'}
    <aside class="hidden xl:flex flex-col w-96 bg-(--color-saheli-surface) border-l-2 border-(--color-saheli-border) h-screen fixed right-0 top-0 shrink-0 z-40">
      <div class="p-5 border-b-2 border-(--color-saheli-border) bg-(--color-saheli-primary) flex items-center justify-between">
        <h2 class="text-xl font-black tracking-tight text-black">SAHELI AI</h2>
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <div class="flex-1 flex flex-col p-5 overflow-hidden">
        <VoiceAssistant chatHistory={[]} languagePref={data.profile?.language_pref || 'en'} />
      </div>
    </aside>
  {/if}

  <!-- Mobile Assistant Drawer (Right) -->
  {#if assistantOpen && currentPath === '/dashboard'}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="xl:hidden fixed inset-0 z-100 bg-black/60 backdrop-blur-sm" onclick={() => assistantOpen = false}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="ml-auto w-[90%] h-full bg-(--color-saheli-surface) border-l-4 border-(--color-saheli-border) flex flex-col animate-slide-right" onclick={(e) => e.stopPropagation()}>
        <div class="p-5 border-b-2 border-(--color-saheli-border) bg-(--color-saheli-primary) flex items-center justify-between">
          <h2 class="text-xl font-black tracking-tight text-black">SAHELI AI</h2>
          <button onclick={() => assistantOpen = false} class="font-black text-2xl text-black">×</button>
        </div>
        <div class="flex-1 flex flex-col p-5 overflow-hidden">
          <VoiceAssistant chatHistory={[]} languagePref={data.profile?.language_pref || 'en'} />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes slide-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes slide-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .animate-slide-left { animation: slide-left 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-slide-right { animation: slide-right 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
</style>
