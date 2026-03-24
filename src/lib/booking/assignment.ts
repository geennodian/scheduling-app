/** Strategy interface for assigning a calendar to a booking */
export interface AssignmentStrategy {
  assign(
    availableCalendarIds: string[],
    allTargets: { connectedCalendarId: string; priorityOrder: number }[]
  ): string | null
}

/** Assign to the first available calendar by priority order */
export class FirstAvailableStrategy implements AssignmentStrategy {
  assign(
    availableCalendarIds: string[],
    allTargets: { connectedCalendarId: string; priorityOrder: number }[]
  ): string | null {
    // Sort targets by priority
    const sorted = [...allTargets].sort((a, b) => a.priorityOrder - b.priorityOrder)
    for (const target of sorted) {
      if (availableCalendarIds.includes(target.connectedCalendarId)) {
        return target.connectedCalendarId
      }
    }
    return availableCalendarIds[0] || null
  }
}

/** Round robin assignment (placeholder - uses a simple index) */
export class RoundRobinStrategy implements AssignmentStrategy {
  private counter = 0

  assign(
    availableCalendarIds: string[],
    allTargets: { connectedCalendarId: string; priorityOrder: number }[]
  ): string | null {
    const available = allTargets
      .filter(t => availableCalendarIds.includes(t.connectedCalendarId))
      .sort((a, b) => a.priorityOrder - b.priorityOrder)

    if (available.length === 0) return null
    const index = this.counter % available.length
    this.counter++
    return available[index].connectedCalendarId
  }
}

// Default strategy
export function getAssignmentStrategy(): AssignmentStrategy {
  return new FirstAvailableStrategy()
}
