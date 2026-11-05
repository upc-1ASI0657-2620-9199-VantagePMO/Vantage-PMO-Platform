import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { ProjectEvents, ProjectSnapshotPayload } from '../../../domain/model/events/project-events';
import { ProjectAlertReader } from '../../../domain/repositories/project-alert.reader';

/**
 * The free Key Value instance is not persistent. On every start the service republishes a
 * snapshot of its projects so that the local replicas of other contexts can be rebuilt
 * (consumers upsert by id, so replays are harmless).
 */
@Injectable()
export class ProjectSnapshotReplayService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProjectSnapshotReplayService.name);

  constructor(
    private readonly reader: ProjectAlertReader,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.EVENT_REPLAY_ON_BOOT === 'false') return;
    setTimeout(() => this.replay().catch((e) => this.logger.warn(`Replay failed: ${e.message}`)), 5_000);
  }

  async replay(): Promise<number> {
    const projects = await this.reader.findAllSnapshots();
    for (const p of projects) {
      const payload: ProjectSnapshotPayload = {
        projectId: p.id, name: p.name, client: p.client, ownerId: p.ownerId,
        status: p.status, startDate: p.startDate, endDate: p.endDate, replay: true,
      };
      await this.events.publish(ProjectEvents.PROJECT_UPDATED, payload);
    }
    this.logger.log(`Replayed ${projects.length} project snapshot(s)`);
    return projects.length;
  }
}
