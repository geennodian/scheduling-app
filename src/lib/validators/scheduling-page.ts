import { z } from 'zod'

export const weekdayRuleSchema = z.object({
  weekday: z.number().min(0).max(6),
  enabled: z.boolean(),
})

export const timeRuleSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const bookingFormSettingSchema = z.object({
  requireCompany: z.boolean().default(false),
  requireName: z.boolean().default(true),
  requireEmail: z.boolean().default(true),
  requirePhone: z.boolean().default(false),
  requireNote: z.boolean().default(false),
})

export const createSchedulingPageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  organizerName: z.string().max(200).optional(),
  mode: z.enum(['COMMON_FREE', 'ANY_FREE']).default('COMMON_FREE'),
  timezone: z.string().default('Asia/Tokyo'),
  dateRangeDays: z.number().min(1).max(90).default(30),
  slotMinutes: z.number().min(15).max(480).default(30),
  bufferBeforeMinutes: z.number().min(0).max(60).default(0),
  bufferAfterMinutes: z.number().min(0).max(60).default(0),
  dailyLimit: z.number().min(1).max(50).nullable().optional(),
  isPublished: z.boolean().default(false),
  calendarCreation: z.enum(['REPRESENTATIVE', 'ASSIGNED']).default('REPRESENTATIVE'),
  weekdayRules: z.array(weekdayRuleSchema).optional(),
  timeRules: z.array(timeRuleSchema).optional(),
  calendarTargetIds: z.array(z.string()).optional(),
  bookingFormSetting: bookingFormSettingSchema.optional(),
})

export const updateSchedulingPageSchema = createSchedulingPageSchema.partial()

export type CreateSchedulingPageInput = z.infer<typeof createSchedulingPageSchema>
export type UpdateSchedulingPageInput = z.infer<typeof updateSchedulingPageSchema>
