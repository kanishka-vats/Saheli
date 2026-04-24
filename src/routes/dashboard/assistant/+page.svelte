<script lang="ts">
  import VoiceAssistant from '$lib/components/VoiceAssistant.svelte';
  import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';
  import { invalidateAll } from '$app/navigation';
  import { createSupabaseBrowserClient } from '$lib/supabase/client';
  import { onMount } from 'svelte';

  let { data } = $props();

  const supabase = createSupabaseBrowserClient();
  let chatKey = $state(0);

  // svelte-ignore state_referenced_locally
  let chatSessions = $state<{id: string, title: string, messages: {id: string, role: string, content: string}[]}[]>(data.chatSessions ?? []);
  // svelte-ignore state_referenced_locally
  let currentHistory = $state<{ role: 'user'|'assistant'; content: string }[]>(chatSessions.length > 0 ? chatSessions[0].messages as any : []);
  let chatSidebarOpen = $state(false); // only used for mobile drawer now

  let showDeleteModal = $state<string | null>(null);
  let showRenameModal = $state<string | null>(null);
  let newSessionName = $state('');
  let activeMenuId = $state<string | null>(null);

  async function startNewChat() {
    currentHistory = [];
    chatKey++;
    chatSidebarOpen = false;
    if (data.user?.id) {
      await supabase.from('chat_history').insert({
        user_id: data.user.id, role: 'assistant', content: '__NEW_CHAT_BOUNDARY__'
      });
    }
  }

  async function confirmDelete(id: string) {
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    chatSessions = chatSessions.filter((s) => s.id !== id);
    if (data.user?.id) {
      const msgIds = session.messages.map(m => m.id);
      if (msgIds.length > 0) { await supabase.from('chat_history').delete().in('id', msgIds); }
    }
    await invalidateAll();
    if (currentHistory === session.messages as any) { currentHistory = []; chatKey++; }
    showDeleteModal = null;
  }

  function startRename(id: string) {
    const session = chatSessions.find(s => s.id === id);
    if (session) { newSessionName = session.title; showRenameModal = id; activeMenuId = null; }
  }

  function saveRename() {
    if (showRenameModal && newSessionName.trim()) {
      const session = chatSessions.find(s => s.id === showRenameModal);
      if (session) { session.title = newSessionName.trim(); }
    }
    showRenameModal = null;
  }
</script>

<svelte:head>
  <title>AI Assistant — Saheli</title>
</svelte:head>

<div class="h-[calc(100dvh-6rem)] md:h-[calc(100dvh-10rem)] flex flex-col md:flex-row gap-6">

  <!-- Mobile Sidebar Toggle -->
  <div class="md:hidden flex justify-between items-center bg-white border-4 border-black p-4 brutal-card shrink-0">
    <div class="flex items-center gap-2">
      <SaheliLogoIcon class="w-6 h-6 text-black" />
      <span class="font-black tracking-tighter uppercase">AI ASSISTANT</span>
    </div>
    <button onclick={() => chatSidebarOpen = !chatSidebarOpen} class="brutal-btn p-2! bg-(--color-saheli-yellow)" aria-label="Toggle Sidebar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  </div>

  <!-- ───── Desktop Sidebar (Side-by-Side) / Mobile Drawer ───── -->
  {#if chatSidebarOpen}
    <button class="md:hidden fixed inset-0 bg-black/80 z-40 cursor-default" onclick={() => chatSidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (chatSidebarOpen = false)} aria-label="Close Sidebar"></button>
  {/if}

  <aside class="
    {chatSidebarOpen ? 'flex fixed inset-y-0 left-0 z-50 animate-slide-left w-72' : 'hidden md:flex md:w-64 lg:w-72'} 
    flex-col bg-white border-4 border-black brutal-card no-card-shift shrink-0"
  >
    <!-- Header -->
    <div class="p-4 border-b-4 border-black bg-(--color-saheli-primary) flex items-center justify-between">
      <h2 class="text-xl font-black tracking-tighter uppercase">CHATS</h2>
      <button aria-label="Close Sidebar" onclick={() => chatSidebarOpen = false} class="md:hidden brutal-btn p-1! bg-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <!-- New Chat -->
    <div class="p-4 border-b-4 border-black">
      <button onclick={startNewChat} class="brutal-btn w-full bg-black! text-white! py-3! gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        NEW CHAT
      </button>
    </div>

    <!-- Previous Chats -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      {#each chatSessions as session}
        <div class="relative group">
          <button
            class="w-full flex items-center justify-between p-3 border-2 border-black font-bold text-sm uppercase text-left transition-colors hover:bg-(--color-saheli-yellow) focus:bg-(--color-saheli-yellow) outline-none"
            onclick={() => { currentHistory = session.messages as any; chatSidebarOpen = false; chatKey++; }}
          >
            <span class="truncate pr-6">{session.title}</span>
          </button>
          
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
            aria-label="Options"
            onclick={(e) => { e.stopPropagation(); activeMenuId = activeMenuId === session.id ? null : session.id; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
          </button>

          {#if activeMenuId === session.id}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="absolute right-0 top-full mt-1 w-32 bg-white border-4 border-black shadow-brutal z-10"
              onclick={(e) => e.stopPropagation()}
            >
              <button class="w-full text-left px-3 py-2 text-xs font-black uppercase hover:bg-(--color-saheli-yellow) border-b-2 border-black" onclick={() => { showDeleteModal = session.id; activeMenuId = null; }}>
                DELETE
              </button>
              <button class="w-full text-left px-3 py-2 text-xs font-black uppercase hover:bg-(--color-saheli-yellow)" onclick={() => startRename(session.id)}>
                RENAME
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </aside>

  <!-- ───── Main Chat Area ───── -->
  <main class="flex-1 brutal-card no-card-shift border-4 border-black bg-white flex flex-col min-h-0 overflow-hidden relative">
    
    <!-- Top Bar -->
    <div class="p-4 border-b-4 border-black flex items-center justify-between shrink-0 bg-(--color-saheli-bg)">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-brutal">
          <SaheliLogoIcon class="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 class="text-xl font-black uppercase tracking-tighter">TALK TO SAHELI</h1>
          <p class="text-[10px] font-bold uppercase opacity-60">YOUR HEALTH COMPANION</p>
        </div>
      </div>
    </div>

    <!-- Chat Component -->
    <div class="flex-1 min-h-0 p-4 md:p-6 overflow-hidden flex flex-col">
      {#key chatKey}
        <VoiceAssistant
          chatHistory={currentHistory}
          languagePref={data.languagePref}
          isGuest={!data.session}
        />
      {/key}
    </div>
  </main>
</div>

<!-- Delete Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 z-100 flex items-center justify-center bg-black/80 px-4">
    <div class="w-full max-w-sm brutal-card border-4 border-black bg-white p-6">
      <h3 class="text-2xl font-black mb-2 uppercase">DELETE CHAT?</h3>
      <p class="text-sm font-bold opacity-70 mb-6 uppercase">
        THIS ACTION CANNOT BE UNDONE. FOREVER IS A LONG TIME.
      </p>
      <div class="flex gap-4">
        <button class="brutal-btn flex-1 bg-white text-black" onclick={() => showDeleteModal = null}>CANCEL</button>
        <button class="brutal-btn flex-1 bg-red-500 text-white" onclick={() => confirmDelete(showDeleteModal!)}>DELETE</button>
      </div>
    </div>
  </div>
{/if}

<!-- Rename Modal -->
{#if showRenameModal}
  <div class="fixed inset-0 z-100 flex items-center justify-center bg-black/80 px-4">
    <div class="w-full max-w-sm brutal-card border-4 border-black bg-white p-6">
      <h3 class="text-2xl font-black mb-4 uppercase">RENAME CHAT</h3>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={newSessionName}
        class="w-full border-4 border-black p-3 mb-6 font-black uppercase text-sm focus:bg-(--color-saheli-yellow) outline-none transition-colors"
        placeholder="NEW NAME..."
        onkeydown={(e) => e.key === 'Enter' && saveRename()}
        autofocus
      />
      <div class="flex gap-4">
        <button class="brutal-btn flex-1 bg-white text-black" onclick={() => showRenameModal = null}>CANCEL</button>
        <button class="brutal-btn flex-1 bg-black text-white" onclick={saveRename}>SAVE</button>
      </div>
    </div>
  </div>
{/if}
