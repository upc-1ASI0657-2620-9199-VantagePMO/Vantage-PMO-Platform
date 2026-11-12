import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent, EVENT_BUS, EventSubscriber } from '@vantage-pmo/event-bus';
import { ConsumedEvents } from '../../../domain/model/events/document-events';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';

/** Builds the local replicas of projects and milestones from Project & Task events (idempotent upserts). */
@Injectable()
export class ReferenceSyncHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventSubscriber,
    private readonly references: ProjectReferenceRepository,
  ) {}

  onModuleInit(): void {
    for (const type of [ConsumedEvents.PROJECT_REGISTERED, ConsumedEvents.PROJECT_UPDATED, ConsumedEvents.PROJECT_STATUS_CHANGED]) {
      this.bus.subscribe(type, (e) => this.onProject(e));
    }
    for (const type of [ConsumedEvents.MILESTONE_ADDED, ConsumedEvents.MILESTONE_COMPLETED]) {
      this.bus.subscribe(type, (e) => this.onMilestone(e));
    }
  }

  async onProject(event: DomainEvent): Promise<void> {
    const p = event.payload as { projectId: string; name: string; ownerId: string; status: string };
    await this.references.upsertProject({ id: p.projectId, name: p.name, ownerId: p.ownerId, status: p.status });
  }

  async onMilestone(event: DomainEvent): Promise<void> {
    const p = event.payload as { projectId: string; milestoneId: string; milestoneName: string; status: string };
    await this.references.upsertMilestone({ id: p.milestoneId, projectId: p.projectId, name: p.milestoneName, status: p.status });
  }
}
