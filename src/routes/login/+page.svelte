<script lang="ts">
  import { createSupabaseBrowserClient } from "$lib/supabase/client";
  import { goto } from "$app/navigation";
  import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
  import { onMount } from "svelte";

  let mode = $state<"login" | "signup">("login");
  let email = $state("");
  let password = $state("");
  let displayName = $state("");
  let loading = $state(false);
  let errorMsg = $state("");
  let successMsg = $state("");

  const supabase = createSupabaseBrowserClient();
  let isDark = $state(false); // Default to light

  onMount(() => {
    const storedTheme = localStorage.theme;
    if (storedTheme === "dark") {
      isDark = true;
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      isDark = false;
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.theme = "light";
    }
  });

  function toggleTheme() {
    isDark = !isDark;
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.theme = theme;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    errorMsg = "";
    successMsg = "";

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) {
        errorMsg = error.message;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          errorMsg = signInError.message;
        } else {
          document.cookie =
            "saheli_guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          goto("/dashboard");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        errorMsg = error.message;
      } else {
        document.cookie =
          "saheli_guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        goto("/dashboard");
      }
    }
    loading = false;
  }

  function enterGuestMode() {
    document.cookie = "saheli_guest=true; path=/; max-age=86400";
    goto("/dashboard");
  }
</script>

<svelte:head>
  <title>{mode === "login" ? "SIGN IN" : "SIGN UP"} — SAHELI</title>
</svelte:head>

<div
  class="min-h-dvh flex items-center justify-center p-6 bg-(--color-saheli-bg) font-sans"
>
  <!-- Back Link -->
  <a
    href="/"
    class="fixed top-8 left-8 font-black text-xl border-b-4 border-(--color-saheli-border) hover:bg-(--color-saheli-text) hover:text-(--color-saheli-bg) px-2 transition-colors text-(--color-saheli-text)"
  >
    ← BACK
  </a>

  <div class="w-full max-w-lg">
    <!-- Header -->
    <div class="text-center mb-10">
      <div class="mb-4 flex justify-center">
        <div
          class="w-24 h-24 bg-(--color-saheli-surface) border-4 border-(--color-saheli-border) flex items-center justify-center shadow-brutal rotate-3 hover:rotate-0 transition-transform"
        >
          <SaheliLogoIcon class="w-12 h-12 text-(--color-saheli-text)" />
        </div>
      </div>
      <h1
        class="text-5xl font-black tracking-tighter text-(--color-saheli-text)"
      >
        SAHELI
      </h1>
      <p
        class="font-bold uppercase tracking-widest text-sm opacity-60 text-(--color-saheli-text)"
      >
        Join Your Period Pal
      </p>
    </div>

    <!-- Login Card -->
    <div
      class="brutal-card p-8 bg-(--color-saheli-surface) border-b-12 border-(--color-saheli-border)"
    >
      <!-- Tabs -->
      <div
        class="flex border-4 border-(--color-saheli-border) mb-8 p-1 bg-(--color-saheli-border)"
      >
        <button
          class="flex-1 py-3 text-lg font-black transition-all duration-100 {mode ===
          'login'
            ? 'bg-(--color-saheli-primary) text-black'
            : 'bg-(--color-saheli-border) text-(--color-saheli-bg)'}"
          onclick={() => (mode = "login")}
          aria-label="Switch to Login"
        >
          LOGIN
        </button>
        <button
          class="flex-1 py-3 text-lg font-black transition-all duration-100 {mode ===
          'signup'
            ? 'bg-(--color-saheli-primary) text-black'
            : 'bg-(--color-saheli-border) text-(--color-saheli-bg)'}"
          onclick={() => (mode = "signup")}
          aria-label="Switch to Signup"
        >
          SIGNUP
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-6">
        {#if mode === "signup"}
          <div class="space-y-2">
            <label
              for="displayName"
              class="block text-sm uppercase tracking-widest text-(--color-saheli-text)"
              >Display Name</label
            >
            <input
              id="displayName"
              type="text"
              bind:value={displayName}
              placeholder="YOUR NAME"
              class="input-brutal text-lg"
            />
          </div>
        {/if}

        <div class="space-y-2">
          <label
            for="email"
            class="block text-sm font-black uppercase tracking-widest text-(--color-saheli-text)"
            >Email Address</label
          >
          <input
            id="email"
            type="email"
            required
            bind:value={email}
            placeholder="YOU@EXAMPLE.COM"
            class="input-brutal text-lg"
          />
        </div>

        <div class="space-y-2">
          <label
            for="password"
            class="block text-sm font-black uppercase tracking-widest text-(--color-saheli-text)"
            >Password</label
          >
          <input
            id="password"
            type="password"
            required
            minlength="6"
            bind:value={password}
            placeholder="YOUR PASSWORD"
            class="input-brutal text-lg"
          />
        </div>

        {#if errorMsg}
          <div
            class="p-4 border-4 border-(--color-saheli-border) bg-red-100 text-red-700 font-black text-sm"
          >
            ERROR: {errorMsg}
          </div>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="brutal-btn w-full text-2xl! py-5! bg-(--color-saheli-text) text-(--color-saheli-bg) disabled:opacity-50"
        >
          {#if loading}
            <span class="inline-block animate-spin mr-3 font-black text-3xl"
              >↻</span
            >
          {/if}
          {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
      </form>

      <div class="mt-6 border-t-4 border-(--color-saheli-border) pt-6 text-center">
        <button
          type="button"
          onclick={enterGuestMode}
          class="brutal-btn w-full bg-transparent text-(--color-saheli-text) hover:bg-(--color-saheli-text) hover:text-(--color-saheli-bg)"
        >
          CONTINUE AS GUEST
        </button>
      </div>
    </div>

    <p
      class="text-center text-xs font-black uppercase mt-10 tracking-widest opacity-40 text-(--color-saheli-text)"
    >
      Science based • Brutally honest • Period tracker
    </p>
  </div>
</div>
