<!-- SaheliLogoIcon.svelte -->
<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";
  let { ...props }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
  {...props}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  <path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  <path d="M12 12v4" />
</svg>
