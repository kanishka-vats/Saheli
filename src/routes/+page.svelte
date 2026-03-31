<script lang="ts">
	import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
	import CalendarIcon from "$lib/components/icons/CalendarIcon.svelte";
	import MoodIcon from "$lib/components/icons/MoodIcon.svelte";
	import MicIcon from "$lib/components/icons/MicIcon.svelte";
	import { onMount } from "svelte";

	let { data } = $props();
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
</script>

<svelte:head>
	<title>Saheli — Menstrual Health Assistant</title>
</svelte:head>

<div
	class="min-h-dvh flex flex-col"
	style="background: var(--color-saheli-bg);"
>
	<!-- Nav -->
	<nav
		class="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full"
	>
		<div class="flex items-center gap-2">
			<SaheliLogoIcon class="w-8 h-8 text-saheli-primary" />
			<span
				class="text-xl font-bold"
				style="color: var(--color-saheli-primary);">Saheli</span
			>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={toggleTheme}
				class="p-2 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 rounded-xl"
				style="color: var(--color-saheli-muted); background: var(--color-saheli-surface);"
				aria-label="Toggle Theme"
			>
				{#if isDark}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
				{/if}
			</button>
			{#if data.session}
				<a
					href="/dashboard"
					class="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent));"
				>
					Dashboard →
				</a>
			{:else}
				<a
					href="/login"
					class="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent));"
				>
					Get Started
				</a>
			{/if}
		</div>
	</nav>

	<!-- Hero -->
	<main class="flex-1 flex items-center justify-center px-6">
		<div class="max-w-2xl text-center animate-fade-in">
			<div class="mb-6 flex justify-center text-saheli-primary">
				<SaheliLogoIcon class="w-20 h-20" />
			</div>
			<h1
				class="text-5xl md:text-6xl font-bold mb-4 leading-tight"
				style="color: var(--color-saheli-text);"
			>
				Your Cycle,<br />
				<span
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
					>Your Companion</span
				>
			</h1>
			<p
				class="text-lg mb-8 max-w-lg mx-auto"
				style="color: var(--color-saheli-muted);"
			>
				Track your periods, log your moods, and talk to an empathetic AI
				assistant that truly understands your menstrual health — in
				Hindi, English, or Hinglish.
			</p>

			<div
				class="flex flex-col sm:flex-row items-center justify-center gap-4"
			>
				<a
					href={data.session ? "/dashboard" : "/login"}
					class="px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:scale-105"
					style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); box-shadow: var(--shadow-glow);"
				>
					{data.session ? "Go to Dashboard" : "Start Your Journey"}
				</a>
			</div>

			<!-- Feature Pills -->
			<div class="flex flex-wrap items-center justify-center gap-3 mt-12">
				{#each [{ icon: CalendarIcon, label: "Period Calendar" }, { icon: MoodIcon, label: "Mood Tracker" }, { icon: MicIcon, label: "Voice Assistant" }] as { icon: Icon, label }}
					<div
						class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
						style="background: var(--color-saheli-surface); color: var(--color-saheli-text); box-shadow: var(--shadow-soft);"
					>
						<Icon class="w-4 h-4 text-saheli-primary" />
						<span>{label}</span>
					</div>
				{/each}
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="py-6 text-center text-xs flex items-center justify-center gap-1"
		style="color: var(--color-saheli-muted);"
	>
		Made with <SaheliLogoIcon class="w-4 h-4 text-saheli-primary mx-0.5" /> for
		every woman's wellbeing
	</footer>

	<!-- Floating AI Bot Button -->
	<a
		href={data.session ? "/dashboard/assistant" : "/login"}
		class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white transition-all duration-300 hover:scale-110 active:scale-95"
		style="background: linear-gradient(135deg, var(--color-saheli-primary), var(--color-saheli-accent)); box-shadow: 0 4px 20px rgba(232, 121, 160, 0.4), 0 0 40px rgba(167, 139, 250, 0.2); animation: fab-pulse 2.5s ease-in-out infinite;"
		title="Talk to Saheli AI"
	>
		<MicIcon class="w-6 h-6" />
	</a>
</div>

<style>
	@keyframes fab-pulse {
		0%,
		100% {
			box-shadow:
				0 4px 20px rgba(232, 121, 160, 0.4),
				0 0 40px rgba(167, 139, 250, 0.2);
		}
		50% {
			box-shadow:
				0 4px 30px rgba(232, 121, 160, 0.6),
				0 0 60px rgba(167, 139, 250, 0.35);
		}
	}
</style>
