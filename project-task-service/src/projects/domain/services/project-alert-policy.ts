/**
 * Domain service with the alert rules of the PMO:
 *  - US09: a pending milestone is "due soon" when its due date falls within the next 24 hours.
 *  - US10 / US53: a project is "stalled" when it is open and had no changes in the last 72 hours.
 * The functions are pure so they can be unit tested without infrastructure.
 */
export class ProjectAlertPolicy {
  static readonly DUE_SOON_HOURS = 24;
  static readonly STALLED_HOURS = 72;

  /** Due dates are calendar days: the milestone is due at the end of that day (23:59:59 UTC). */
  static isMilestoneDueSoon(dueDate: string, status: string, asOf: Date): boolean {
    if (status !== 'PENDING') return false;
    const deadline = new Date(`${dueDate}T23:59:59.999Z`).getTime();
    const hoursLeft = (deadline - asOf.getTime()) / 3_600_000;
    return hoursLeft >= 0 && hoursLeft <= ProjectAlertPolicy.DUE_SOON_HOURS;
  }

  static inactiveHours(lastActivityAt: Date, asOf: Date): number {
    return Math.floor((asOf.getTime() - lastActivityAt.getTime()) / 3_600_000);
  }

  static isProjectStalled(status: string, lastActivityAt: Date, asOf: Date): boolean {
    if (status !== 'PLANNED' && status !== 'IN_PROGRESS') return false;
    return ProjectAlertPolicy.inactiveHours(lastActivityAt, asOf) >= ProjectAlertPolicy.STALLED_HOURS;
  }

  /** Business keys: the same fact always produces the same key, so consumers notify only once. */
  static dueSoonKey(milestoneId: string, dueDate: string): string {
    return `milestone-due-soon:${milestoneId}:${dueDate}`;
  }

  static stalledKey(projectId: string, lastActivityAt: Date): string {
    return `project-stalled:${projectId}:${lastActivityAt.toISOString()}`;
  }
}
