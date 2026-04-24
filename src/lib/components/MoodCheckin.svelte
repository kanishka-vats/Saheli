<script lang="ts">
  let {
    onSave
  }: {
    onSave?: (data: { mood_score: number; energy: number; symptoms: string[]; notes: string }) => void;
  } = $props();

  let moodScore = $state(3);
  let energy = $state(3);
  let selectedSymptoms = $state<string[]>([]);
  let notes = $state('');
  let saved = $state(false);

  const moodEmojis = [
    { value: 1, label: 'TERRIBLE' },
    { value: 2, label: 'BAD' },
    { value: 3, label: 'OKAY' },
    { value: 4, label: 'GOOD' },
    { value: 5, label: 'GREAT' }
  ];

  const symptomOptions = [
    'CRAMPS', 'HEADACHE', 'BLOATING', 'FATIGUE', 'BACK PAIN',
    'NAUSEA', 'TENDERNESS', 'MOOD SWINGS', 'INSOMNIA', 'ACNE'
  ];

  function toggleSymptom(s: string) {
    if (selectedSymptoms.includes(s)) {
      selectedSymptoms = selectedSymptoms.filter((x) => x !== s);
    } else {
      selectedSymptoms = [...selectedSymptoms, s];
    }
  }

  function handleSave() {
    onSave?.({ mood_score: moodScore, energy, symptoms: selectedSymptoms, notes });
    saved = true;
    setTimeout(() => saved = false, 3000);
  }
</script>

<div class="brutal-card no-card-shift p-8 bg-(--color-saheli-surface) font-sans">
  <h2 class="text-4xl font-black mb-2 uppercase tracking-tighter text-(--color-saheli-text)">DAILY CHECK-IN</h2>
  <p class="text-lg font-bold mb-8 uppercase opacity-60 text-(--color-saheli-text)">HOW ARE YOU FEELING TODAY?</p>

  <!-- Mood -->
  <div class="mb-10">
    <span class="block text-sm font-black uppercase mb-4 tracking-widest text-(--color-saheli-text)">CURRENT MOOD</span>
    <div class="grid grid-cols-5 gap-3">
      {#each moodEmojis as m}
        <button
          onclick={() => moodScore = m.value}
          class="flex flex-col items-center gap-2 p-4 border-4 border-(--color-saheli-border) transition-all duration-100 {moodScore === m.value ? 'bg-(--color-saheli-primary) shadow-brutal translate-x-[-2px] translate-y-[-2px] text-black' : 'bg-(--color-saheli-surface) text-(--color-saheli-text) hover:bg-(--color-saheli-bg)'}"
          aria-label="Mood: {m.label}"
          aria-pressed={moodScore === m.value}
        >
          <div class="text-2xl font-black">
            {#if m.value === 1} 😠 {:else if m.value === 2} 🙁 {:else if m.value === 3} 😐 {:else if m.value === 4} 🙂 {:else if m.value === 5} 😁 {/if}
          </div>
          <span class="text-[10px] font-black uppercase">{m.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Energy -->
  <div class="mb-10">
    <label for="energy-range" class="block text-sm font-black uppercase mb-4 tracking-widest text-(--color-saheli-text)">
      ENERGY LEVEL: <span class="text-2xl text-(--color-saheli-accent)">{energy}/5</span>
    </label>
    <div class="relative h-10 flex items-center">
      <input
        id="energy-range" type="range" min="1" max="5" step="1" bind:value={energy}
        class="w-full h-4 bg-(--color-saheli-text) appearance-none cursor-pointer border-4 border-(--color-saheli-border)"
      />
    </div>
  </div>

  <!-- Symptoms -->
  <div class="mb-10">
    <span class="block text-sm font-black uppercase mb-4 tracking-widest text-(--color-saheli-text)">PHYSICAL SYMPTOMS</span>
    <div class="flex flex-wrap gap-3">
      {#each symptomOptions as symptom}
        <button
          onclick={() => toggleSymptom(symptom)}
          class="px-5 py-3 border-4 border-(--color-saheli-border) font-black text-xs transition-all duration-100 {selectedSymptoms.includes(symptom) ? 'bg-(--color-saheli-accent) text-white shadow-brutal translate-x-[-2px] translate-y-[-2px]' : 'bg-(--color-saheli-surface) text-(--color-saheli-text)'}"
          aria-pressed={selectedSymptoms.includes(symptom)}
        >
          {symptom}
        </button>
      {/each}
    </div>
  </div>

  <!-- Notes -->
  <div class="mb-10">
    <label for="notes" class="block text-sm font-black uppercase mb-4 tracking-widest text-(--color-saheli-text)">NOTES</label>
    <textarea
      id="notes" bind:value={notes} placeholder="ANYTHING ELSE? (MAX 100 CHARS)"
      rows="2"
      maxlength="100"
      class="input-brutal text-lg! uppercase"
    ></textarea>
  </div>

  <!-- Save -->
  <button
    onclick={handleSave}
    class="brutal-btn w-full text-2xl! py-5! bg-(--color-saheli-text) text-(--color-saheli-bg) border-(--color-saheli-border)"
  >
    {saved ? 'LOGGED! ✔' : 'CONFIRM CHECK-IN'}
  </button>
</div>

<style>
  input[type=range]::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 32px;
    background: var(--color-saheli-accent);
    border: 4px solid var(--color-saheli-border);
    cursor: pointer;
  }
</style>
