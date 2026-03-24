import { prisma } from '@/lib/prisma'

const LOCK_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export async function acquireLock(
  schedulingPageId: string,
  slotStart: string
): Promise<boolean> {
  const slotKey = slotStart
  const now = new Date()

  try {
    // Delete expired locks
    await prisma.bookingLock.deleteMany({
      where: {
        schedulingPageId,
        expiresAt: { lt: now },
      },
    })

    // Try to create lock
    await prisma.bookingLock.create({
      data: {
        schedulingPageId,
        slotKey,
        expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
      },
    })
    return true
  } catch {
    // Unique constraint violation = lock already held
    return false
  }
}

export async function releaseLock(
  schedulingPageId: string,
  slotStart: string
): Promise<void> {
  await prisma.bookingLock.deleteMany({
    where: {
      schedulingPageId,
      slotKey: slotStart,
    },
  })
}

export async function cleanExpiredLocks(): Promise<void> {
  await prisma.bookingLock.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}
