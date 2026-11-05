import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { MilestoneDueSoonPayload, ProjectEvents, ProjectStalledPayload } from '../../../domain/model/events/project-events';
import { ProjectAlertReader } from '../../../domain/repositories/project-alert.reader';
import { ProjectAlertPolicy } from '../../../domain/services/project-alert-policy';

export interface AlertScanResult {
  asOf: string;
  milestonesDueSoon: number;
  stalledProjects: number;
  events: { type: string; key: string; projectId: string }[];
}

/**
 * Scheduled job (US53): looks for milestones about to expire (US09) and inactive projects (US10)
 * and publishes one integration event per finding. Notification Service turns them into alerts.
 */
@Injectable()
export class ProjectAlertScanService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ProjectAlertScanService.name);
  private timer?: NodeJS.Timeout;
  private firstRun?: NodeJS.Timeout;

  constructor(
    private readonly reader: ProjectAlertReader,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    const interval = Number(process.env.ALERT_SCAN_INTERVAL_MS ?? 3_600_000);
    if (interval <= 0) return;
    // Free cloud instances sleep when idle, so the scan also runs shortly after every start.
    this.firstRun = setTimeout(() => this.safeScan(), 15_000);
    this.timer = setInterval(() => this.safeScan(), interval);
  }

  onApplicationShutdown(): void {
    clearTimeout(this.firstRun);
    clearInterval(this.timer);
  }

  async scan(asOf: Date = new Date()): Promise<AlertScanResult> {
    const result: AlertScanResult = { asOf: asOf.toISOString(), milestonesDueSoon: 0, stalledProjects: 0, events: [] };
    const today = asOf.toISOString().substring(0, 10);
    const tomorrow = new Date(asOf.getTime() + 86_400_000).toISOString().substring(0, 10);

    for (const m of await this.reader.findPendingMilestonesDueBetween(today, tomorrow)) {
      if (!ProjectAlertPolicy.isMilestoneDueSoon(m.dueDate, m.status, asOf)) continue;
      const key = ProjectAlertPolicy.dueSoonKey(m.milestoneId, m.dueDate);
      const payload: MilestoneDueSoonPayload = {
        projectId: m.projectId, projectName: m.projectName, ownerId: m.ownerId,
        milestoneId: m.milestoneId, milestoneName: m.milestoneName, dueDate: m.dueDate,
      };
      await this.events.publish(ProjectEvents.MILESTONE_DUE_SOON, payload, key);
      result.milestonesDueSoon += 1;
      result.events.push({ type: ProjectEvents.MILESTONE_DUE_SOON, key, projectId: m.projectId });
    }

    for (const p of await this.reader.findOpenProjectsActivity()) {
      if (!ProjectAlertPolicy.isProjectStalled(p.status, p.lastActivityAt, asOf)) continue;
      const key = ProjectAlertPolicy.stalledKey(p.projectId, p.lastActivityAt);
      const payload: ProjectStalledPayload = {
        projectId: p.projectId, projectName: p.projectName, ownerId: p.ownerId,
        lastActivityAt: p.lastActivityAt.toISOString(),
        inactiveHours: ProjectAlertPolicy.inactiveHours(p.lastActivityAt, asOf),
      };
      await this.events.publish(ProjectEvents.PROJECT_STALLED, payload, key);
      result.stalledProjects += 1;
      result.events.push({ type: ProjectEvents.PROJECT_STALLED, key, projectId: p.projectId });
    }

    this.logger.log(`Alert scan as of ${result.asOf}: ${result.milestonesDueSoon} milestone(s) due soon, ${result.stalledProjects} stalled project(s)`);
    return result;
  }

  private async safeScan(): Promise<void> {
    try {
      await this.scan();
    } catch (e) {
      this.logger.error(`Alert scan failed: ${(e as Error).message}`);
    }
  }
}
