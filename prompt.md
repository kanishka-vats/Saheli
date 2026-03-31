Act as a Senior Full-Stack Engineer and AI Architect. I want to build a Menstrual Health Assistant web app called "Saheli" (or choose your name) using SvelteKit (Svelte 5 Runes), Tailwind CSS, Bun, Supabase, and Groq.

### 0. RESEARCH & ENVIRONMENT
- Check the latest documentation for SvelteKit 2.x, Supabase-js, and Groq SDK (2026 versions).
- Read the existing `.env` file for `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, and `GROQ_API_KEY`.
- Ensure all logic uses Bun as the runtime.

### 1. DATABASE SETUP (Supabase)
Create a migration or SQL script to set up these tables with Row Level Security (RLS) so users only see their own data:
- `profiles`: id (uuid), display_name, language_pref ('hi' or 'en'), avg_cycle_length.
- `period_logs`: id, user_id, start_date, end_date, flow_intensity.
- `mood_logs`: id, user_id, date, mood_score (1-5), symptoms (array), notes.
- `chat_history`: id, user_id, role, content, timestamp.

### 2. AUTHENTICATION
- Implement a basic Email/Password Auth flow using `@supabase/auth-ui-svelte`.
- Create a protected `/dashboard` layout.

### 3. FEATURES
- **Period Calendar**: A visual monthly calendar (use a modern Svelte calendar lib or build with Tailwind). Highlight 'Active Period' days in red/pink and 'Predicted' days in light pink based on `avg_cycle_length`.
- **Mood Tracker**: A "Daily Check-in" card. Ask 3 quick questions (Mood, Energy, Physical Symptoms). Save these to `mood_logs`.
- **Voice Assistant (The Brain)**:
  - **STT**: Use Groq's `whisper-large-v3-turbo` to transcribe user voice in real-time.
  - **LLM Logic**: Use Groq (`llama-3.1-8b-instant`). 
  - **Context Injection**: When the user asks a question, the backend must fetch the last 3 months of `period_logs` and `mood_logs` and include them in the System Prompt so the AI knows where the user is in her cycle.
  - **Multilingual**: The System Prompt must instruct the AI to respond in the user's preferred language (Hindi/English/Hinglish) with high empathy and a medical disclaimer.
  - **TTS**: Use the Web Speech API or an Edge-TTS wrapper to read the response aloud.

### 4. UI/UX
- Use Tailwind for a "Calm & Clean" and modern aesthetic (Pastels, soft rounded corners).
- Ensure the Voice Assistant has a prominent "Waveform" animation when listening.

### 5. EXECUTION PLAN
1. Initialize the Supabase client and Auth hooks.
2. Build the database schema and RLS policies.
3. Create the Calendar and Mood Quiz components.
4. Build the API route `/api/chat` that handles the Groq orchestration (Audio -> Text -> LLM + Context -> Speech).
5. Wire everything together in the SvelteKit dashboard.

Go ahead and plan the file structure, then start with the Supabase schema and Auth setup.
