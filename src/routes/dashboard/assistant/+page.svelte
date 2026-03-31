<script lang="ts">
	import VoiceAssistant from '$lib/components/VoiceAssistant.svelte';
	import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';
	import { invalidateAll } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase/client';

	let { data } = $props();

	const supabase = createSupabaseBrowserClient();
	let chatKey = $state(0);
	
	// svelte-ignore state_referenced_locally
	let chatSessions = $state<{id: string, title: string, messages: {id: string, role: string, content: string}[]}[]>(data.chatSessions ?? []);
	// svelte-ignore state_referenced_locally
	let currentHistory = $state<{ role: 'user'|'assistant'; content: string }[]>(chatSessions.length > 0 ? chatSessions[0].messages as any : []);
	let chatSidebarOpen = $state(false);

	let showDeleteModal = $state<string | null>(null);
	let showRenameModal = $state<string | null>(null);
	let newSessionName = $state('');
	let activeMenuId = $state<string | null>(null);

	async function startNewChat() {
		currentHistory = [];
		chatKey++;
		chatSidebarOpen = false;

		// Insert boundary message so next refresh doesn't group the new chat with the old one
		if (data.user?.id) {
			await supabase.from('chat_history').insert({
				user_id: data.user.id,
				role: 'assistant',
				content: '__NEW_CHAT_BOUNDARY__'
			});
		}
	}

	async function confirmDelete(id: string) {
		const session = chatSessions.find(s => s.id === id);
		if (!session) return;
		
		chatSessions = chatSessions.filter((s) => s.id !== id);
		
		if (data.user?.id) {
			const msgIds = session.messages.map(m => m.id);
			if (msgIds.length > 0) {
				await supabase.from('chat_history').delete().in('id', msgIds);
			}
		}
		
		if (currentHistory === session.messages as any) {
			currentHistory = [];
			chatKey++;
		}
		showDeleteModal = null;
	}

	function startRename(id: string) {
		const session = chatSessions.find(s => s.id === id);
		if (session) {
			newSessionName = session.title;
			showRenameModal = id;
			activeMenuId = null;
		}
	}

	function saveRename() {
		if (showRenameModal && newSessionName.trim()) {
			const session = chatSessions.find(s => s.id === showRenameModal);
			if (session) {
				session.title = newSessionName.trim();
				// Currently just storing locally in state since sessions are generated dynamically
			}
		}
		showRenameModal = null;
	}
</script>

<svelte:head>
	<title>AI Assistant — Saheli</title>
</svelte:head>

<div class="max-w-2xl mx-auto h-[calc(100dvh-6rem)] relative flex flex-col">
	<!-- Chatbot Sidebar (Overlay) -->
	{#if chatSidebarOpen}
		<!-- Backdrop -->
		<button class="fixed inset-0 bg-black/40 z-40 transition-opacity cursor-default" onclick={() => chatSidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (chatSidebarOpen = false)} aria-label="Close Sidebar"></button>
		
		<div class="fixed inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl animate-fade-in" style="background: var(--color-saheli-surface); border-right: 1px solid var(--color-saheli-border);">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b" style="border-color: var(--color-saheli-border);">
				<div class="flex items-center gap-2">
					<SaheliLogoIcon class="w-6 h-6 text-saheli-primary" />
					<span class="font-bold text-lg" style="color: var(--color-saheli-primary);">Saheli</span>
				</div>
				<button aria-label="Close Sidebar" onclick={() => chatSidebarOpen = false} class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5" style="color: var(--color-saheli-muted);">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				</button>
			</div>

			<!-- New Chat -->
			<div class="p-4">
				<button onclick={startNewChat} class="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2" style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); box-shadow: var(--shadow-glow);">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
					New Chat
				</button>
			</div>

			<!-- Previous Chats List -->
			<div class="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
				<p class="px-1 pt-2 pb-2 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-saheli-muted);">Previous Chats</p>
				
				{#each chatSessions as session}
				<div 
					role="button"
					tabindex="0"
					class="group relative flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/5 cursor-pointer text-sm font-medium transition-colors" 
					style="color: var(--color-saheli-text);"
					onclick={() => { currentHistory = session.messages as any; chatSidebarOpen = false; chatKey++; }}
					onkeydown={(e) => { if (e.key === 'Enter') { currentHistory = session.messages as any; chatSidebarOpen = false; chatKey++; } }}
				>
					<div class="flex items-center gap-3 truncate pr-4">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-saheli-muted);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
						<span class="truncate">{session.title}</span>
					</div>
					
					<!-- Three Dots Menu for Rename / Delete -->
					<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 relative">
						<button 
							class="w-7 h-7 flex items-center justify-center rounded hover:bg-black/10 transition-colors relative"
							aria-label="Menu"
							onclick={(e) => { e.stopPropagation(); activeMenuId = activeMenuId === session.id ? null : session.id; }}
							style="color: var(--color-saheli-muted);"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
						</button>
						
						{#if activeMenuId === session.id}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div 
								class="absolute right-0 top-8 w-32 rounded-xl shadow-lg border z-50 overflow-hidden" 
								style="background: var(--color-saheli-surface); border-color: var(--color-saheli-border);"
								onclick={(e) => e.stopPropagation()}
							>
								<button 
									class="w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors flex items-center gap-2"
									style="color: var(--color-saheli-text);"
									onclick={() => { showDeleteModal = session.id; activeMenuId = null; }}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
									Delete
								</button>
								<button 
									class="w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors flex items-center gap-2"
									style="color: var(--color-saheli-text);"
									onclick={() => startRename(session.id)}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
									Rename
								</button>
							</div>
						{/if}
					</div>
				</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mb-4 shrink-0 animate-fade-in flex items-center justify-between">
		<div class="flex items-center gap-3">
			<button aria-label="Open Sidebar" onclick={() => chatSidebarOpen = true} class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 my-auto" style="color: var(--color-saheli-text);">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
			</button>
			<div>
				<h1 class="text-xl md:text-2xl font-bold leading-tight" style="color: var(--color-saheli-text);">Talk to Saheli</h1>
				<p class="text-xs md:text-sm" style="color: var(--color-saheli-muted);">Your health companion</p>
			</div>
		</div>
	</div>

	<div class="animate-fade-in flex-1 min-h-0 flex flex-col" style="animation-delay: 0.1s;">
		{#key chatKey}
			<VoiceAssistant
				chatHistory={currentHistory}
				languagePref={data.languagePref}
			/>
		{/key}
	</div>
</div>

<!-- Modals -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 animate-fade-in">
		<div class="w-full max-w-sm rounded-2xl p-6 shadow-xl" style="background: var(--color-saheli-surface); border: 1px solid var(--color-saheli-border);">
			<h3 class="text-lg font-bold mb-2" style="color: var(--color-saheli-text);">Delete Conversation</h3>
			<p class="text-sm mb-6" style="color: var(--color-saheli-muted);">
				Are you sure you want to delete this conversation forever? This action cannot be undone.
			</p>
			<div class="flex items-center gap-3">
				<button 
					class="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5" 
					style="color: var(--color-saheli-text); border: 1px solid var(--color-saheli-border);"
					onclick={() => showDeleteModal = null}
				>
					No, Keep it
				</button>
				<button 
					class="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" 
					style="background: #ef4444;"
					onclick={() => confirmDelete(showDeleteModal!)}
				>
					Yes, Delete
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showRenameModal}
	<div class="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 animate-fade-in">
		<div class="w-full max-w-sm rounded-2xl p-6 shadow-xl" style="background: var(--color-saheli-surface); border: 1px solid var(--color-saheli-border);">
			<h3 class="text-lg font-bold mb-4" style="color: var(--color-saheli-text);">Rename Conversation</h3>
			<!-- svelte-ignore a11y_autofocus -->
			<input 
				type="text" 
				bind:value={newSessionName}
				class="w-full px-4 py-2 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2"
				style="background: var(--color-saheli-bg); color: var(--color-saheli-text); border: 1px solid var(--color-saheli-border); --tw-ring-color: var(--color-saheli-primary);"
				placeholder="New name..."
				onkeydown={(e) => e.key === 'Enter' && saveRename()}
				autofocus
			/>
			<div class="flex items-center gap-3">
				<button 
					class="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5" 
					style="color: var(--color-saheli-text); border: 1px solid var(--color-saheli-border);"
					onclick={() => showRenameModal = null}
				>
					Cancel
				</button>
				<button 
					class="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" 
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent));"
					onclick={saveRename}
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

