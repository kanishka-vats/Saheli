<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase/client';

	import HomeIcon from '$lib/components/icons/HomeIcon.svelte';
	import MicIcon from '$lib/components/icons/MicIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import MoodIcon from '$lib/components/icons/MoodIcon.svelte';
	import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const supabase = createSupabaseBrowserClient();
	let sidebarOpen = $state(false);
	let isDark = $state(false);

	onMount(() => {
		if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			document.documentElement.classList.add('dark');
			isDark = true;
		} else {
			document.documentElement.classList.remove('dark');
			isDark = false;
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.theme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.theme = 'light';
		}
	}

	const navItems = [
		{ href: '/dashboard', label: 'Home', icon: HomeIcon },
		{ href: '/dashboard/assistant', label: 'AI Assistant', icon: MicIcon },
		{ href: '/dashboard/calendar', label: 'Calendar', icon: CalendarIcon },
		{ href: '/dashboard/mood', label: 'Mood', icon: MoodIcon }
	];

	const currentPath = $derived($page.url.pathname);

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-dvh flex" style="background: var(--color-saheli-bg);">
	<!-- Sidebar (Desktop) -->
	<aside class="hidden md:flex flex-col w-64 p-4 border-r" style="background: var(--color-saheli-surface); border-color: var(--color-saheli-border);">
		<!-- Logo -->
		<div class="flex items-center gap-2 px-3 mb-8">
			<SaheliLogoIcon class="w-8 h-8 text-[#CFA195]" />
			<span class="text-xl font-bold" style="color: var(--color-saheli-primary);">Saheli</span>
		</div>

		<!-- Nav -->
		<nav class="flex-1 space-y-1">
			{#each navItems as {href, label, icon: Icon}}
				<a
					href={href}
					class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
					style="background: {currentPath === href ? 'var(--color-saheli-secondary-1)' : 'transparent'}; color: {currentPath === href ? 'var(--color-saheli-primary)' : 'var(--color-saheli-muted)'};"
				>
					<Icon class="w-5 h-5" />
					{label}
				</a>
			{/each}
		</nav>

		<!-- User / Sign Out / Theme -->
		<div class="border-t pt-4 mt-4" style="border-color: var(--color-saheli-border);">
			<div class="px-3 mb-3">
				<p class="text-sm font-medium" style="color: var(--color-saheli-text);">{data.profile?.display_name ?? 'User'}</p>
				<p class="text-xs" style="color: var(--color-saheli-muted);">{data.user?.email}</p>
			</div>
			<div class="flex items-center gap-2 px-1">
				<button
					onclick={signOut}
					class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
					style="color: var(--color-saheli-muted); background: var(--color-saheli-secondary-1);"
				>
					<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
					Sign Out
				</button>
				<button
					onclick={toggleTheme}
					class="p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
					style="color: var(--color-saheli-muted); background: var(--color-saheli-secondary-1);"
					aria-label="Toggle Theme"
				>
					{#if isDark}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
					{/if}
				</button>
			</div>
		</div>
	</aside>

	<!-- Mobile Header -->
	<div class="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style="background: var(--color-saheli-surface); border-color: var(--color-saheli-border);">
		<button onclick={() => sidebarOpen = !sidebarOpen} class="text-2xl cursor-pointer">☰</button>
		<div class="flex items-center gap-2">
			<SaheliLogoIcon class="w-6 h-6 text-[#CFA195]" />
			<span class="font-bold" style="color: var(--color-saheli-primary);">Saheli</span>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={toggleTheme}
				class="p-2 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
				style="color: var(--color-saheli-muted);"
				aria-label="Toggle Theme"
			>
				{#if isDark}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
				{/if}
			</button>
			<button onclick={signOut} class="p-2 text-sm cursor-pointer" style="color: var(--color-saheli-muted);" aria-label="Sign Out">
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
			</button>
		</div>
	</div>

	<!-- Mobile Sidebar Overlay -->
	{#if sidebarOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="md:hidden fixed inset-0 z-40 bg-black/30"
			onclick={() => sidebarOpen = false}
		>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<nav
				class="w-64 h-full p-4 space-y-1"
				style="background: var(--color-saheli-surface);"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex items-center gap-2 px-3 mb-6">
					<SaheliLogoIcon class="w-8 h-8 text-[#CFA195]" />
					<span class="text-xl font-bold" style="color: var(--color-saheli-primary);">Saheli</span>
				</div>
				{#each navItems as {href, label, icon: Icon}}
					<a
						href={href}
						onclick={() => sidebarOpen = false}
						class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
						style="background: {currentPath === href ? 'var(--color-saheli-secondary-1)' : 'transparent'}; color: {currentPath === href ? 'var(--color-saheli-primary)' : 'var(--color-saheli-muted)'};"
					>
						<Icon class="w-5 h-5" />
						{label}
					</a>
				{/each}
			</nav>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 p-6 md:p-8 mt-14 md:mt-0 overflow-y-auto">
		{@render children()}
	</main>

	<!-- Floating AI button on non-assistant pages -->
	{#if currentPath !== '/dashboard' && currentPath !== '/dashboard/assistant'}
		<a
			href="/dashboard/assistant"
			class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 md:hidden"
			style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); box-shadow: 0 4px 20px rgba(135, 86, 75, 0.4);"
			title="Talk to Saheli"
		>
			<MicIcon class="w-6 h-6" />
		</a>
	{/if}
</div>
