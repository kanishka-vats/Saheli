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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>" />
</svelte:head>

<!-- Custom cursor -->
<CustomCursor />

{@render children()}
