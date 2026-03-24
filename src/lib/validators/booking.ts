import { z } from 'zod'

export const createBookingSchema = z.object({
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  companyName: z.string().max(200).optional(),
  personName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  note: z.string().max(2000).optional(),
  availableCalendarIds: z.array(z.string()).optional(),
  availableGroupIds: z.array(z.string()).optional(),
})

export const lockSlotSchema = z.object({
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type LockSlotInput = z.infer<typeof lockSlotSchema>
