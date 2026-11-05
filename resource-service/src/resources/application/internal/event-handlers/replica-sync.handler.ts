import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainEvent, EVENT_BUS, EventSubscriber } from '@vantage-pmo/event-bus';
import { ConsumedEvents } from '../../../domain/model/events/resource-events';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';

/**
 * Event-driven synchronization of the local replicas (members and projects).
 * Upserts make the handler idempotent: replays and duplicated deliveries are harmless.
 */
@Injectable()
export class ReplicaSyncHandler implements OnModuleInit {
  private readonly logger = new Logger(ReplicaSyncHandler.name);

  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventSubscriber,
    private readonly members: MemberRepository,
    private readonly projects: ProjectReferenceRepository,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(ConsumedEvents.USER_REGISTERED, (e) => this.onUserRegistered(e));
    for (const type of [ConsumedEvents.PROJECT_REGISTERED, ConsumedEvents.PROJECT_UPDATED, ConsumedEvents.PROJECT_STATUS_CHANGED]) {
      this.bus.subscribe(type, (e) => this.onProjectChanged(e));
    }
  }

  async onUserRegistered(event: DomainEvent): Promise<void> {
    const p = event.payload as { userId: string; fullName: string; email: string; role: string };
    await this.members.upsert({ id: p.userId, fullName: p.fullName, email: p.email, role: p.role });
    if (!(event.payload as { replay?: boolean }).replay) this.logger.log(`Member ${p.userId} synchronized`);
  }

  async onProjectChanged(event: DomainEvent): Promise<void> {
    const p = event.payload as { projectId: string; name: string; ownerId: string; status: string; startDate: string; endDate: string };
    await this.projects.upsert({ id: p.projectId, name: p.name, ownerId: p.ownerId, status: p.status, startDate: p.startDate, endDate: p.endDate });
  }
}
