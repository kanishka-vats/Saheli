<script lang="ts">
  import MoodCheckin from "$lib/components/MoodCheckin.svelte";
  import { invalidateAll } from "$app/navigation";
  import { createSupabaseBrowserClient } from "$lib/supabase/client";
  import { deserialize } from "$app/forms";

  let { data } = $props();
  const supabase = createSupabaseBrowserClient();

  async function handleSave(checkinData: {
    mood_score: number;
    energy: number;
    symptoms: string[];
    notes: string;
  }) {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("mood_logs").insert({
      user_id: data.user?.id,
      mood_score: checkinData.mood_score,
      energy: checkinData.energy,
      symptoms: checkinData.symptoms,
      notes: checkinData.notes || null,
      date: today,
    });
    if (error) {
      console.error("Save error:", error);
      return;
    }
    await invalidateAll();
  }

  async function deleteEntry(id: string) {
    if (!confirm("DELETE THIS ENTRY?")) return;

    const formData = new FormData();
    formData.append("id", id);

    const response = await fetch("?/delete", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await invalidateAll();
    } else {
      console.error("Delete failed");
    }
  }
</script>

<svelte:head>
  <title>MOODS — SAHELI</title>
</svelte:head>

<div class="max-w-3xl mx-auto flex flex-col gap-6 lg:h-[calc(100dvh-4rem)]">
  <header class="border-b-4 md:border-b-8 border-black pb-4 md:pb-8 shrink-0">
    <div class="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
      <div
        class="w-12 h-12 md:w-16 md:h-16 bg-(--color-saheli-primary) text-black flex items-center justify-center border-2 md:border-4 border-black shadow-brutal"
      >
        <svg
          width="24"
          height="24"
          class="md:w-8 md:h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          ><circle cx="12" cy="12" r="10"></circle><path
            d="M8 14s1.5 2 4 2 4-2 4-2"
          ></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line
            x1="15"
            y1="9"
            x2="15.01"
            y2="9"
          ></line></svg
        >
      </div>
      <h1
        class="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-black"
      >
        MOOD TRACKER
      </h1>
    </div>
    <p class="text-xs md:text-xl font-bold uppercase tracking-tight opacity-70">
      LOG SYMPTOMS • ANALYZE TRENDS
    </p>
  </header>

  <div class="flex-1 min-h-0 overflow-y-auto pr-2 pb-4 space-y-8">
    <div class="animate-brutal-up shrink-0">
      <MoodCheckin onSave={handleSave} />
    </div>

    <!-- Recent History -->
    {#if data.moodLogs?.length}
      <section
        class="space-y-6 animate-brutal-up shrink-0"
        style="animation-delay: 0.1s;"
      >
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter">
          RECENT ENTRIES
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {#each data.moodLogs.slice(0, 8) as log}
            <div class="brutal-card p-6 bg-white flex flex-col justify-between">
              <div class="flex justify-between items-start mb-4">
                <div
                  class="w-12 h-12 border-4 border-black flex items-center justify-center text-2xl bg-(--color-saheli-yellow)"
                >
                  {#if log.mood_score === 1}
                    😠
                  {:else if log.mood_score === 2}
                    🙁
                  {:else if log.mood_score === 3}
                    😐
                  {:else if log.mood_score === 4}
                    🙂
                  {:else if log.mood_score === 5}
                    😁
                  {/if}
                </div>
                <div class="text-right">
                  <p class="font-black text-xs uppercase opacity-60">
                    {new Date(log.date).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    onclick={() => deleteEntry(log.id)}
                    class="font-black text-[10px] text-red-600 hover:bg-black hover:text-white px-1 mt-1 transition-colors"
                  >
                    DELETE ENTRY [×]
                  </button>
                </div>
              </div>

              <div class="space-y-3">
                <p class="text-xl font-black uppercase leading-tight">
                  MOOD: {log.mood_score}/5<br />
                  ENERGY: {log.energy}/5
                </p>
                {#if log.symptoms?.length}
                  <div class="flex flex-wrap gap-1">
                    {#each log.symptoms as s}
                      <span
                        class="text-[10px] font-black bg-black text-white px-1.5 py-0.5"
                        >{s}</span
                      >
                    {/each}
                  </div>
                {/if}

                {#if log.notes}
                  <div class="pt-2 border-t-2 border-black border-dashed">
                    <p
                      class="text-[10px] font-bold uppercase opacity-60 italic"
                    >
                      Notes:
                    </p>
                    <p class="text-xs font-bold uppercase leading-tight">
                      {log.notes}
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  @keyframes brutal-up {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-brutal-up {
    animation: brutal-up 0.2s steps(3) both;
  }
</style>
