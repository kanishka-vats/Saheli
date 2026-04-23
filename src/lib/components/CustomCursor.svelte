<script lang="ts">
  import { onMount } from "svelte";

  let x = $state(0);
  let y = $state(0);
  let visible = $state(false);

  onMount(() => {
    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) visible = true;
    };

    document.addEventListener("mousemove", move);
    return () => {
      document.removeEventListener("mousemove", move);
    };
  });
</script>

{#if visible}
  <div
    class="cursor-brutal"
    style="transform: translate({x - 12}px, {y - 12}px);"
    aria-hidden="true"
  ></div>
{/if}

<style>
  .cursor-brutal {
    position: fixed;
    top: 0;
    left: 0;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 2px solid #000000;
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    mix-blend-mode: difference;
    transition:
      transform 0.05s linear,
      width 0.1s ease,
      height 0.1s ease;
  }

  /* Scale up slightly on hover if we want, but user requested color change only */
  /* mix-blend-mode: difference already handles the color change dynamically */

  @media (hover: none) {
    .cursor-brutal {
      display: none;
    }
  }
</style>
