import { z } from 'zod';

export const profileSchema = z.object({
	display_name: z.string().min(2, 'Name too short').max(30, 'Name too long').trim(),
	avgCycleLength: z.number().min(20).max(45),
	periodLength: z.number().min(1).max(10).optional()
});

export const chatSchema = z.object({
	text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long').trim()
});

export const moodSchema = z.object({
	mood_score: z.number().min(1).max(5),
	energy: z.number().min(1).max(5),
	symptoms: z.array(z.string()),
	notes: z.string().max(100, 'Notes too long (max 100 characters)').optional()
});
