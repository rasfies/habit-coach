import { z } from "zod";

// ─────────────────────────────────────────────
// Shared patterns
// ─────────────────────────────────────────────

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const SignUpSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const RefreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export const OAuthSchema = z.object({
  redirect_url: z.string().url("Must be a valid URL"),
});

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export const UpdateProfileSchema = z
  .object({
    display_name: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name must be at most 50 characters")
      .optional(),
    reminder_time: z
      .string()
      .regex(timePattern, "Must be in HH:MM format")
      .nullable()
      .optional(),
    notification_enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const OnboardingSchema = z.object({
  onboarding_complete: z.literal(true),
});

// ─────────────────────────────────────────────
// Habits
// ─────────────────────────────────────────────

export const CreateHabitSchema = z.object({
  name: z
    .string()
    .min(1, "Habit name is required")
    .max(100, "Habit name must be at most 100 characters"),
  icon: z.string().max(10, "Icon must be at most 10 characters").optional(),
  reminder_time: z
    .string()
    .regex(timePattern, "Must be in HH:MM format")
    .optional(),
  frequency: z.literal("daily"),
});

export const UpdateHabitSchema = z
  .object({
    name: z
      .string()
      .min(1, "Habit name is required")
      .max(100, "Habit name must be at most 100 characters")
      .optional(),
    icon: z.string().max(10).nullable().optional(),
    reminder_time: z
      .string()
      .regex(timePattern, "Must be in HH:MM format")
      .nullable()
      .optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const ReorderHabitsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z
          .string()
          .regex(uuidPattern, "Must be a valid UUID"),
        sort_order: z.number().int().min(0),
      })
    )
    .min(1, "At least one habit order entry is required"),
});

// ─────────────────────────────────────────────
// Habit Logs
// ─────────────────────────────────────────────

export const LogHabitSchema = z.object({
  log_date: z
    .string()
    .regex(datePattern, "Must be in YYYY-MM-DD format")
    .optional(),
});

// ─────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(60, "Group name must be at most 60 characters"),
});

export const JoinGroupSchema = z.object({
  invite_code: z.string().min(1, "Invite code is required"),
});

// ─────────────────────────────────────────────
// AI Coaching
// ─────────────────────────────────────────────

export const GenerateMessageSchema = z.object({
  message_type: z.enum(["daily", "day1_welcome", "streak_3", "streak_7"]),
  habit_id: z
    .string()
    .regex(uuidPattern, "Must be a valid UUID")
    .optional(),
});

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const RegisterTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["ios", "android", "web"]),
});

export const UpdateNotificationPrefsSchema = z.object({
  notification_enabled: z.boolean(),
  reminder_time: z
    .string()
    .regex(timePattern, "Must be in HH:MM format")
    .nullable()
    .optional(),
});

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
export type ReorderHabitsInput = z.infer<typeof ReorderHabitsSchema>;
export type LogHabitInput = z.infer<typeof LogHabitSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type JoinGroupInput = z.infer<typeof JoinGroupSchema>;
export type GenerateMessageInput = z.infer<typeof GenerateMessageSchema>;
export type RegisterTokenInput = z.infer<typeof RegisterTokenSchema>;
export type UpdateNotificationPrefsInput = z.infer<
  typeof UpdateNotificationPrefsSchema
>;
