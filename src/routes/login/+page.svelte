<script lang="ts">
	import { createSupabaseBrowserClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import SaheliLogoIcon from '$lib/components/icons/SaheliLogoIcon.svelte';

	let mode = $state<'login' | 'signup'>('login');
	let email = $state('');
	let password = $state('');
	let displayName = $state('');
	let loading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	const supabase = createSupabaseBrowserClient();
	
	import { onMount } from 'svelte';
	let isDark = $state(false);

	onMount(() => {
		if (
			localStorage.theme === "dark" ||
			(!("theme" in localStorage) &&
				window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			document.documentElement.classList.add("dark");
			isDark = true;
		} else {
			document.documentElement.classList.remove("dark");
			isDark = false;
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add("dark");
			localStorage.theme = "dark";
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.theme = "light";
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = '';
		successMsg = '';

		if (mode === 'signup') {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { display_name: displayName || email.split('@')[0] }
				}
			});
			if (error) {
				errorMsg = error.message;
			} else {
				// Auto sign-in after signup (no email confirmation)
				const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
				if (signInError) {
					errorMsg = signInError.message;
				} else {
					goto('/dashboard');
				}
			}
		} else {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				errorMsg = error.message;
			} else {
				goto('/dashboard');
			}
		}
		loading = false;
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Sign In' : 'Sign Up'} — Saheli</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 relative" style="background: var(--color-saheli-bg);">
	<!-- Dark Mode Toggle Top Right -->
	<button
		onclick={toggleTheme}
		class="absolute top-6 right-6 p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
		style="color: var(--color-saheli-muted); background: var(--color-saheli-surface); box-shadow: var(--shadow-soft);"
		aria-label="Toggle Theme"
	>
		{#if isDark}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
		{/if}
	</button>

	<div class="w-full max-w-md animate-fade-in">
		<!-- Logo -->
		<div class="text-center mb-8">
			<div class="mb-3 flex justify-center text-saheli-primary"><SaheliLogoIcon class="w-12 h-12" /></div>
			<h1 class="text-3xl font-bold" style="color: var(--color-saheli-primary);">Saheli</h1>
			<p class="text-sm mt-1" style="color: var(--color-saheli-muted);">Your menstrual health companion</p>
		</div>

		<!-- Card -->
		<div class="rounded-2xl p-8" style="background: var(--color-saheli-surface); box-shadow: var(--shadow-card);">
			<!-- Tabs -->
			<div class="flex rounded-xl overflow-hidden mb-6 p-1" style="background: var(--color-saheli-secondary-1);">
				<button
					class="flex-1 py-2.5 text-sm font-medium transition-all duration-200"
					style="background: {mode === 'login' ? 'var(--color-saheli-primary)' : 'transparent'}; color: {mode === 'login' ? 'var(--color-saheli-bg)' : 'var(--color-saheli-muted)'}; border-radius: 0.5rem;"
					onclick={() => { mode = 'login'; errorMsg = ''; successMsg = ''; }}
				>
					Sign In
				</button>
				<button
					class="flex-1 py-2.5 text-sm font-medium transition-all duration-200"
					style="background: {mode === 'signup' ? 'var(--color-saheli-primary)' : 'transparent'}; color: {mode === 'signup' ? 'var(--color-saheli-bg)' : 'var(--color-saheli-muted)'}; border-radius: 0.5rem;"
					onclick={() => { mode = 'signup'; errorMsg = ''; successMsg = ''; }}
				>
					Sign Up
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if mode === 'signup'}
					<div>
						<label for="displayName" class="block text-sm font-medium mb-1.5" style="color: var(--color-saheli-text);">Display Name</label>
						<input
							id="displayName"
							type="text"
							bind:value={displayName}
							placeholder="e.g. Priya"
							class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
							style="background: var(--color-rose-50); border: 2px solid transparent; color: var(--color-saheli-text);"
							onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-saheli-primary)')}
							onblur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium mb-1.5" style="color: var(--color-saheli-text);">Email</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="you@example.com"
						class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
						style="background: var(--color-rose-50); border: 2px solid transparent; color: var(--color-saheli-text);"
						onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-saheli-primary)')}
						onblur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium mb-1.5" style="color: var(--color-saheli-text);">Password</label>
					<input
						id="password"
						type="password"
						required
						minlength="6"
						bind:value={password}
						placeholder="••••••••"
						class="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
						style="background: var(--color-rose-50); border: 2px solid transparent; color: var(--color-saheli-text);"
						onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-saheli-primary)')}
						onblur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
					/>
				</div>

				{#if errorMsg}
					<div class="px-4 py-3 rounded-xl text-sm" style="background: #fef2f2; color: #dc2626;">{errorMsg}</div>
				{/if}

				{#if successMsg}
					<div class="px-4 py-3 rounded-xl text-sm" style="background: var(--color-mint-50); color: #16a34a;">{successMsg}</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-60"
					style="background: var(--color-saheli-primary); color: var(--color-saheli-bg); box-shadow: var(--shadow-glow);"
				>
					{#if loading}
						<span class="inline-block animate-spin mr-2">↻</span>
					{/if}
					{mode === 'login' ? 'Sign In' : 'Create Account'}
				</button>
			</form>
		</div>

		<p class="text-center text-xs mt-6" style="color: var(--color-saheli-muted);">
			By continuing, you agree to our Terms of Service
		</p>
	</div>
</div>
