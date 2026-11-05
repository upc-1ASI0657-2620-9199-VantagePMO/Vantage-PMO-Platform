import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { IamEvents, UserRegisteredPayload } from '../../../domain/model/events/iam-events';
import { UserRepository } from '../../../domain/repositories/user.repository';

/** Republishes the user directory on start so other contexts can rebuild their member replicas. */
@Injectable()
export class UserSnapshotReplayService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserSnapshotReplayService.name);

  constructor(
    private readonly users: UserRepository,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.EVENT_REPLAY_ON_BOOT === 'false') return;
    setTimeout(() => this.replay().catch((e) => this.logger.warn(`Replay failed: ${e.message}`)), 5_000);
  }

  async replay(): Promise<number> {
    const users = await this.users.findAll();
    for (const u of users) {
      const payload: UserRegisteredPayload = { userId: u.id, fullName: u.fullName, email: u.email, role: u.role, replay: true };
      await this.events.publish(IamEvents.USER_REGISTERED, payload);
    }
    this.logger.log(`Replayed ${users.length} user snapshot(s)`);
    return users.length;
  }
}
