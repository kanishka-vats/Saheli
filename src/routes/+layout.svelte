<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase/client';

	let { data, children } = $props();

	const supabase = createSupabaseBrowserClient();

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤎</text></svg>" />
</svelte:head>

{@render children()}
