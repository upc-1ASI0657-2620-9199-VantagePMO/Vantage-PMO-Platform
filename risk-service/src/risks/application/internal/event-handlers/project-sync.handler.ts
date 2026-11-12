import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent, EVENT_BUS, EventSubscriber } from '@vantage-pmo/event-bus';
import { ConsumedEvents } from '../../../domain/model/events/risk-events';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';

/** Builds the local replica of projects from Project & Task events (idempotent upserts). */
@Injectable()
export class ProjectSyncHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventSubscriber,
    private readonly projects: ProjectReferenceRepository,
  ) {}

  onModuleInit(): void {
    for (const type of Object.values(ConsumedEvents)) this.bus.subscribe(type, (e) => this.onProject(e));
  }

  async onProject(event: DomainEvent): Promise<void> {
    const p = event.payload as { projectId: string; name: string; ownerId: string; status: string };
    await this.projects.upsert({ id: p.projectId, name: p.name, ownerId: p.ownerId, status: p.status });
  }
}
