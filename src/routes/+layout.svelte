<script lang="ts">
  import './layout.css';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { createSupabaseBrowserClient } from '$lib/supabase/client';
  import CustomCursor from '$lib/components/CustomCursor.svelte';

  let { data, children } = $props();

  const supabase = createSupabaseBrowserClient();

  onMount(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', e.clientX.toString());
      document.documentElement.style.setProperty('--mouse-y', e.clientY.toString());
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth');
      }
    });

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      subscription.unsubscribe();
    };
  });
</script>

<svelte:head>
  <title>Saheli - Your Cycle Companion</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF7C15' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'/><path d='M12 12v4'/></svg>" />
</svelte:head>

<!-- Custom cursor -->
<CustomCursor />

{@render children()}
