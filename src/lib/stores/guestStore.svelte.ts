import { browser } from '$app/environment';

// Helper to use sessionStorage with Svelte 5 runes
function createSessionStore<T>(key: string, initialValue: T) {
    let data = $state<T>(initialValue);

    if (browser) {
        const saved = sessionStorage.getItem(key);
        if (saved) {
            try {
                data = JSON.parse(saved);
            } catch (e) {
                console.error(`Error parsing sessionStorage for ${key}`, e);
            }
        }

        // Sync to sessionStorage on changes
        $effect.root(() => {
            $effect(() => {
                sessionStorage.setItem(key, JSON.stringify(data));
            });
        });
    }

    return {
        get value() { return data; },
        set value(v: T) { data = v; }
    };
}

export const guestMoodLogs = createSessionStore<any[]>('saheli_guest_moods', []);
export const guestPeriodLogs = createSessionStore<any[]>('saheli_guest_periods', []);
export const guestChatCount = createSessionStore<number>('saheli_guest_chats', 0);
