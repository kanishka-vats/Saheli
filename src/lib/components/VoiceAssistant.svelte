<script lang="ts">
  import { onMount } from "svelte";
  import SaheliLogoIcon from "$lib/components/icons/SaheliLogoIcon.svelte";
  import MicIcon from "$lib/components/icons/MicIcon.svelte";

  import { guestChatCount } from "$lib/stores/guestStore.svelte";

  type ChatMessage = {
    role: "user" | "assistant";
    content: string;
  };

  let {
    chatHistory = [],
    languagePref = "en",
    isGuest = false,
  }: {
    chatHistory: ChatMessage[];
    languagePref: string;
    isGuest?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let messages = $state<ChatMessage[]>([...chatHistory]);
  let textInput = $state("");
  let isRecording = $state(false);
  let isProcessing = $state(false);
  let isSpeaking = $state(false);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let audioChunks = $state<Blob[]>([]);
  let chatContainer: HTMLDivElement | undefined = $state();
  let errorMessage = $state("");

  // Waveform
  let analyser = $state<AnalyserNode | null>(null);
  let animFrameId = $state(0);
  let waveformCanvas: HTMLCanvasElement | undefined = $state();
  let audioContext: AudioContext | null = $state(null);

  // TTS - preload voices
  let voices: SpeechSynthesisVoice[] = $state([]);

  onMount(() => {
    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        voices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
        window.speechSynthesis.cancel();
      };
    }
  });

  function scrollToBottom() {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer!.scrollTop = chatContainer!.scrollHeight;
      }, 50);
    }
  }

  async function startRecording() {
    try {
      errorMessage = "";
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameId);
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        await sendAudio(blob);
      };
      recorder.start();
      mediaRecorder = recorder;
      isRecording = true;
      drawWaveform();
    } catch (err: any) {
      console.error("Mic access denied:", err);
      errorMessage =
        "Microphone access denied. Please allow mic access in your browser settings.";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      isRecording = false;
    }
  }

  function drawWaveform() {
    if (!analyser || !waveformCanvas) return;
    const ctx = waveformCanvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const W = waveformCanvas.width;
    const H = waveformCanvas.height;

    function draw() {
      animFrameId = requestAnimationFrame(draw);
      analyser!.getByteFrequencyData(dataArray);
      ctx!.clearRect(0, 0, W, H);
      const barCount = 30;
      const barWidth = W / barCount - 4;
      const step = Math.floor(bufferLength / barCount);
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(8, value * H * 0.9);
        const x = i * (barWidth + 4);
        const y = (H - barHeight) / 2;
        ctx!.fillStyle =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-saheli-text")
            .trim() || "#000000";
        ctx!.fillRect(x, y, barWidth, barHeight);
      }
    }
    draw();
  }

  async function sendAudio(blob: Blob) {
    if (isGuest && guestChatCount.value >= 3) {
      errorMessage = "LIMIT REACHED! PLEASE LOGIN TO CONTINUE CHATTING WITH SAHELI.";
      isProcessing = false;
      return;
    }

    isProcessing = true;
    errorMessage = "";
    try {
      if (isGuest) {
        guestChatCount.value++;
      }
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/chat", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        errorMessage = data.error || data.message || "Something went wrong";
        return;
      }
      if (data.userText) {
        messages = [...messages, { role: "user", content: data.userText }];
      }
      if (data.assistantText) {
        messages = [
          ...messages,
          { role: "assistant", content: data.assistantText },
        ];
        speak(data.assistantText);
      }
      scrollToBottom();
    } catch (err) {
      console.error("Chat error:", err);
      errorMessage = "Failed to connect to the server. Please try again.";
    } finally {
      isProcessing = false;
    }
  }

  async function sendText() {
    if (isGuest && guestChatCount.value >= 3) {
      errorMessage = "LIMIT REACHED! PLEASE LOGIN TO CONTINUE CHATTING WITH SAHELI.";
      return;
    }

    const text = textInput.trim();
    textInput = "";
    errorMessage = "";
    messages = [...messages, { role: "user", content: text }];
    scrollToBottom();
    isProcessing = true;
    try {
      if (isGuest) {
        guestChatCount.value++;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorMessage = data.error || data.message || "Something went wrong";
        return;
      }
      if (data.assistantText) {
        messages = [
          ...messages,
          { role: "assistant", content: data.assistantText },
        ];
        speak(data.assistantText);
      }
      scrollToBottom();
    } catch (err) {
      console.error("Chat error:", err);
      errorMessage = "Failed to connect to the server. Please try again.";
    } finally {
      isProcessing = false;
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const hasHindiChars = /[\u0900-\u097F]/.test(text);
      const targetLangs = hasHindiChars
        ? ["hi-IN", "hi"]
        : ["en-IN", "en-GB", "en-US", "en"];
      let preferredVoice: SpeechSynthesisVoice | undefined;
      for (const lang of targetLangs) {
        const matching = voices.filter(
          (v) =>
            v.lang.startsWith(lang) ||
            v.lang.replace("_", "-").startsWith(lang),
        );
        if (matching.length > 0) {
          preferredVoice = matching[0];
          break;
        }
      }
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = hasHindiChars ? "hi-IN" : "en-IN";
      }
      utterance.onstart = () => {
        isSpeaking = true;
      };
      utterance.onend = () => {
        isSpeaking = false;
      };
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }

  const quickPrompts = [
    "WHERE AM I IN MY CYCLE?",
    "WHY AM I FEELING TIRED?",
    "TIPS FOR CRAMPS",
    "NEXT PERIOD DATE?",
  ];
</script>

<div class="flex flex-col h-full w-full font-sans">
  <!-- Chat Messages -->
  <div
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 custom-scrollbar"
  >
    {#if messages.length === 0}
      <div
        class="flex flex-col items-center justify-center h-full text-center py-8"
      >
        <div
          class="w-16 h-16 bg-(--color-saheli-primary) border-4 border-(--color-saheli-border) shadow-brutal flex items-center justify-center mb-4 rotate-3"
        >
          <SaheliLogoIcon class="w-8 h-8 text-black" />
        </div>
        <h3
          class="text-xl font-black tracking-tighter uppercase text-(--color-saheli-text)"
        >
          I'M SAHELI.
        </h3>
        <p
          class="text-[10px] font-bold max-w-[180px] mb-6 uppercase opacity-60 text-(--color-saheli-text)"
        >
          YOUR AI COMPANION. ASK ME ABOUT YOUR CYCLE OR MOOD.
        </p>

        <!-- Quick Prompts -->
        <div class="flex flex-wrap items-center justify-center gap-2 px-2">
          {#each quickPrompts as prompt}
            <button
              onclick={() => {
                textInput = prompt;
                sendText();
              }}
              class="px-2 py-1.5 border-2 border-(--color-saheli-border) bg-(--color-saheli-surface) font-black text-[9px] uppercase hover:bg-(--color-saheli-yellow) text-(--color-saheli-text) transition-colors"
            >
              {prompt}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#each messages as msg}
      <div
        class="flex flex-col {msg.role === 'user'
          ? 'items-end'
          : 'items-start'} gap-1"
      >
        <span
          class="text-[9px] font-black uppercase opacity-50 px-1 text-(--color-saheli-text)"
        >
          {msg.role === "user" ? "YOU" : "SAHELI"}
        </span>
        <div
          class="flex gap-2 {msg.role === 'user'
            ? 'flex-row-reverse'
            : 'flex-row'} items-end max-w-[90%]"
        >
          {#if msg.role === "assistant"}
            <div
              class="w-6 h-6 shrink-0 bg-black flex items-center justify-center border border-black shadow-[1px_1px_0px_white]"
            >
              <SaheliLogoIcon class="w-4 h-4 text-white" />
            </div>
          {/if}
          <div
            class="px-3 py-2 border-2 border-(--color-saheli-border) font-bold text-xs md:text-sm leading-tight uppercase {msg.role ===
            'user'
              ? 'bg-(--color-saheli-text) text-(--color-saheli-bg) shadow-[-2px_2px_0px_0px_var(--color-saheli-primary)]'
              : 'bg-(--color-saheli-surface) text-(--color-saheli-text) shadow-[2px_2px_0px_0px_var(--color-saheli-yellow)]'}"
          >
            {msg.content}
          </div>
        </div>
      </div>
    {/each}

    {#if isProcessing}
      <div class="flex justify-start">
        <div
          class="px-3 py-2 border-2 border-(--color-saheli-border) bg-(--color-saheli-surface) shadow-[2px_2px_0px_0px_var(--color-saheli-yellow)] flex items-center gap-2"
        >
          <div class="flex gap-1">
            <div
              class="w-1.5 h-1.5 bg-(--color-saheli-text) animate-bounce"
            ></div>
            <div
              class="w-1.5 h-1.5 bg-(--color-saheli-text) animate-bounce delay-75"
            ></div>
            <div
              class="w-1.5 h-1.5 bg-(--color-saheli-text) animate-bounce delay-150"
            ></div>
          </div>
        </div>
      </div>
    {/if}

      {#if isGuest && guestChatCount.value >= 3}
        <div class="p-4 border-4 border-black bg-(--color-saheli-yellow) space-y-3 shadow-brutal animate-bounce">
          <p class="font-black text-sm uppercase text-center">LIMIT REACHED! LOGIN TO CONTINUE YOUR CHAT WITH SAHELI.</p>
          <a href="/login" class="brutal-btn w-full bg-black text-white py-3! text-center block">LOGIN / SIGNUP</a>
        </div>
      {:else}
        <div
          class="p-2 border-2 border-black bg-red-100 text-red-900 font-black text-[9px] uppercase text-center"
        >
          ERROR: {errorMessage}
        </div>
      {/if}
    {/if}
  </div>

  <!-- Bottom Interactive Area -->
  <div
    class="border-t-4 border-(--color-saheli-border) pt-4 bg-(--color-saheli-surface) space-y-4"
  >
    <!-- Waveform / Indicators (Relative to input) -->
    <div class="flex items-center justify-between min-h-[24px]">
      {#if isRecording}
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-red-600 animate-ping"></div>
          <canvas
            bind:this={waveformCanvas}
            width="100"
            height="20"
            class="bg-(--color-saheli-bg) border border-(--color-saheli-border)"
          ></canvas>
        </div>
      {:else if isSpeaking}
        <button
          onclick={stopSpeaking}
          class="flex items-center gap-2 px-2 py-1 bg-(--color-saheli-yellow) border-2 border-(--color-saheli-border) animate-pulse text-black"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            ><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg
          >
          <span class="text-[9px] font-black uppercase">STOP VOICE</span>
        </button>
      {:else}
        <span
          class="text-[9px] font-black opacity-30 uppercase tracking-widest text-(--color-saheli-text)"
          >READY TO HELP</span
        >
      {/if}
    </div>

    <!-- Input Bar -->
    <div class="flex items-stretch gap-2">
      <button
        onclick={() => (isRecording ? stopRecording() : startRecording())}
        disabled={isProcessing}
        class="w-12 h-12 shrink-0 border-4 border-(--color-saheli-border) flex items-center justify-center transition-all {isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-(--color-saheli-primary) hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal text-black'}"
        title="Voice"
      >
        <MicIcon class="w-6 h-6" />
      </button>

      <div class="flex-1 relative">
        <input
          bind:value={textInput}
          onkeydown={handleKeydown}
          placeholder="ASK SAHELI..."
          class="w-full h-12 border-4 border-(--color-saheli-border) px-3 font-black text-xs uppercase bg-(--color-saheli-surface) text-(--color-saheli-text) focus:bg-(--color-saheli-bg) outline-none"
        />
      </div>

      <button
        onclick={sendText}
        disabled={!textInput.trim() || isProcessing}
        class="w-12 h-12 shrink-0 bg-(--color-saheli-text) text-(--color-saheli-bg) border-4 border-(--color-saheli-border) flex items-center justify-center disabled:opacity-50"
        aria-label="Send Message"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="4"><path d="M5 12h14M12 5l7 7-7 7" /></svg
        >
      </button>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--color-saheli-bg);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-saheli-primary);
    border: 2px solid var(--color-saheli-bg);
  }
</style>
