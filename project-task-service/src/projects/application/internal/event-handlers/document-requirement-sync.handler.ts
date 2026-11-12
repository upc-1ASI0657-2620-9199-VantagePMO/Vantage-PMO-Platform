import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEvent, EVENT_BUS, EventSubscriber } from '@vantage-pmo/event-bus';
import { DocumentEvents } from '../../../domain/model/events/project-events';
import { MilestoneDocumentRequirementRepository } from '../../../domain/repositories/milestone-document-requirement.repository';

/** Keeps the replica of mandatory milestone documents in sync with the Document context. */
@Injectable()
export class DocumentRequirementSyncHandler implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventSubscriber,
    private readonly requirements: MilestoneDocumentRequirementRepository,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(DocumentEvents.REQUIREMENT_DEFINED, (e) => this.onDefined(e));
    this.bus.subscribe(DocumentEvents.REQUIREMENT_FULFILLED, (e) => this.onFulfilled(e));
    this.bus.subscribe(DocumentEvents.REQUIREMENT_REMOVED, (e) => this.onRemoved(e));
  }

  async onDefined(event: DomainEvent): Promise<void> {
    const p = event.payload as { requirementId: string; projectId: string; milestoneId: string; name: string; fulfilled?: boolean };
    await this.requirements.upsert({
      requirementId: p.requirementId, projectId: p.projectId, milestoneId: p.milestoneId, name: p.name, fulfilled: p.fulfilled ?? false,
    });
  }

  async onFulfilled(event: DomainEvent): Promise<void> {
    await this.requirements.markFulfilled((event.payload as { requirementId: string }).requirementId);
  }

  async onRemoved(event: DomainEvent): Promise<void> {
    await this.requirements.remove((event.payload as { requirementId: string }).requirementId);
  }
}
