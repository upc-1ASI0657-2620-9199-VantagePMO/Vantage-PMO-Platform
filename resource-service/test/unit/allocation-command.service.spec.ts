import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { AllocationCommandService } from '../../src/resources/application/internal/command-services/allocation-command.service';
import { ReplicaSyncHandler } from '../../src/resources/application/internal/event-handlers/replica-sync.handler';
import { ResourceAllocation } from '../../src/resources/domain/model/aggregates/resource-allocation';
import { AllocateMemberCommand } from '../../src/resources/domain/model/commands/resource-commands';
import { Member } from '../../src/resources/domain/model/entities/member';
import { ProjectReference } from '../../src/resources/domain/model/entities/project-reference';
import { AllocationRepository } from '../../src/resources/domain/repositories/allocation.repository';
import { MemberRepository } from '../../src/resources/domain/repositories/member.repository';
import { ProjectReferenceRepository } from '../../src/resources/domain/repositories/project-reference.repository';
import { ResourceNotFoundError } from '../../src/shared/domain/domain-error';

class InMemoryAllocations extends AllocationRepository {
  items = new Map<string, ResourceAllocation>();
  async save(a: ResourceAllocation) { this.items.set(a.id, a); }
  async delete(id: string) { this.items.delete(id); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByProjectId(id: string) { return [...this.items.values()].filter((a) => a.projectId === id); }
  async findByMemberId(id: string) { return [...this.items.values()].filter((a) => a.memberId === id); }
  async findOverlapping(from: string, to: string) { return [...this.items.values()].filter((a) => a.startDate <= to && a.endDate >= from); }
}
class InMemoryMembers extends MemberRepository {
  items = new Map<string, Member>();
  async upsert(m: Member) { this.items.set(m.id, m); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findAll() { return [...this.items.values()]; }
}
class InMemoryProjects extends ProjectReferenceRepository {
  items = new Map<string, ProjectReference>();
  async upsert(p: ProjectReference) { this.items.set(p.id, p); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByIds(ids: string[]) { return ids.map((id) => this.items.get(id)!).filter(Boolean); }
}

describe('Resource Management application layer', () => {
  let bus: InMemoryEventBus;
  let service: AllocationCommandService;

  beforeEach(async () => {
    bus = new InMemoryEventBus('resource');
    const members = new InMemoryMembers();
    const projects = new InMemoryProjects();
    const sync = new ReplicaSyncHandler(bus, members, projects);
    sync.onModuleInit();
    service = new AllocationCommandService(new InMemoryAllocations(), members, projects, bus);
    // the replicas are built from the events of IAM and Project & Task
    await bus.publish('iam.user-registered', { userId: 'm1', fullName: 'Lucía Torres', email: 'lucia@vantage.pe', role: 'MEMBER' });
    for (const id of ['p1', 'p2']) {
      await bus.publish('projects.project-registered', {
        projectId: id, name: `Proyecto ${id}`, ownerId: 'owner', status: 'IN_PROGRESS', startDate: '2026-11-01', endDate: '2027-01-31',
      });
    }
  });

  const command = (projectId: string, percentage: number) =>
    new AllocateMemberCommand(projectId, 'm1', 'Desarrolladora', percentage, '2026-11-09', '2026-12-18', 'owner');

  it('allocates a synchronized member and announces it to the member', async () => {
    const result = await service.handleAllocate(command('p1', 60));
    expect(result.memberTotalAllocation).toBe(60);
    expect(result.overallocated).toBe(false);
    expect(bus.published.at(-1)!.type).toBe('resources.member-allocated');
  });

  it('warns the project owner when the member exceeds 100 %', async () => {
    await service.handleAllocate(command('p1', 60));
    const result = await service.handleAllocate(command('p2', 50));
    expect(result.overallocated).toBe(true);
    const warning = bus.published.find((e) => e.type === 'resources.member-overallocated')!;
    expect(warning.payload).toMatchObject({ memberId: 'm1', ownerId: 'owner', totalAllocation: 110 });
  });

  it('fails with not found when the member is not known by Resource Management', async () => {
    await expect(service.handleAllocate(new AllocateMemberCommand('p1', 'unknown', 'Dev', 50, '2026-11-09', '2026-12-18', 'owner')))
      .rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('applies the project status received by events (closed projects reject allocations)', async () => {
    await bus.publish('projects.project-status-changed', {
      projectId: 'p1', name: 'Proyecto p1', ownerId: 'owner', status: 'CANCELLED', startDate: '2026-11-01', endDate: '2027-01-31',
    });
    await expect(service.handleAllocate(command('p1', 50))).rejects.toThrow('no longer be allocated');
  });
});
