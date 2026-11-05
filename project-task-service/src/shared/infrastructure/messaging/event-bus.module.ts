import { Global, Inject, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { createEventBus, EVENT_BUS, EventBus } from '@vantage-pmo/event-bus';

/**
 * Infrastructure adapter for the custom event-bus library. Every bounded context publishes
 * through the EventPublisher port; the concrete broker (Redis Streams on Render Key Value)
 * is chosen by configuration.
 */
@Global()
@Module({
  providers: [{ provide: EVENT_BUS, useFactory: (): EventBus => createEventBus(process.env.SERVICE_NAME ?? 'project-task') }],
  exports: [EVENT_BUS],
})
export class EventBusModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(@Inject(EVENT_BUS) private readonly bus: EventBus) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.bus.start();
    Logger.log(`Event bus ready (${this.bus.kind})`, 'EventBus');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.bus.stop();
  }
}
