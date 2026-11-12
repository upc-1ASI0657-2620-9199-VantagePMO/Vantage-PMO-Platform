import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { DocumentCommandService } from '../../src/documents/application/internal/command-services/document-command.service';
import { ReferenceSyncHandler } from '../../src/documents/application/internal/event-handlers/reference-sync.handler';
import { FileStorage } from '../../src/documents/application/internal/outbound-services/file-storage';
import { Document } from '../../src/documents/domain/model/aggregates/document';
import { DocumentRequirement } from '../../src/documents/domain/model/aggregates/document-requirement';
import { DefineRequirementCommand, UploadDocumentCommand } from '../../src/documents/domain/model/commands/document-commands';
import { MilestoneReference, ProjectReference } from '../../src/documents/domain/model/entities/project-reference';
import { FileContent } from '../../src/documents/domain/model/value-objects/file-content';
import { DocumentRequirementRepository } from '../../src/documents/domain/repositories/document-requirement.repository';
import { DocumentRepository } from '../../src/documents/domain/repositories/document.repository';
import { ProjectReferenceRepository } from '../../src/documents/domain/repositories/project-reference.repository';
import { ConflictError, DomainError, ResourceNotFoundError } from '../../src/shared/domain/domain-error';

const pdf = (text: string, name = 'acta.pdf') => FileContent.of(name, 'application/pdf', Buffer.from(text));

class InMemoryDocuments extends DocumentRepository {
  items = new Map<string, Document>();
  async save(d: Document) { this.items.set(d.id, d); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByName(p: string, n: string, t: string | null, m: string | null) {
    return [...this.items.values()].find((d) => d.projectId === p && d.name === n && d.taskId === t && d.milestoneId === m) ?? null;
  }
  async findByProject(p: string) { return [...this.items.values()].filter((d) => d.projectId === p); }
}
class InMemoryRequirements extends DocumentRequirementRepository {
  items = new Map<string, DocumentRequirement>();
  async save(r: DocumentRequirement) { this.items.set(r.id, r); }
  async delete(id: string) { this.items.delete(id); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByMilestone(m: string) { return [...this.items.values()].filter((r) => r.milestoneId === m); }
  async existsByName(m: string, n: string) { return [...this.items.values()].some((r) => r.milestoneId === m && r.name === n); }
}
class InMemoryReferences extends ProjectReferenceRepository {
  projects = new Map<string, ProjectReference>();
  milestones = new Map<string, MilestoneReference>();
  async upsertProject(p: ProjectReference) { this.projects.set(p.id, p); }
  async upsertMilestone(m: MilestoneReference) { this.milestones.set(m.id, m); }
  async findProject(id: string) { return this.projects.get(id) ?? null; }
  async findMilestone(id: string) { return this.milestones.get(id) ?? null; }
}
class InMemoryStorage extends FileStorage {
  files = new Map<string, Buffer>();
  async put(k: string, d: Buffer) { this.files.set(k, d); }
  async get(k: string) { return this.files.get(k)!; }
}

describe('FileContent value object (US45)', () => {
  it('fingerprints the content and keeps the metadata', () => {
    const f = pdf('contenido');
    expect(f.checksum).toHaveLength(64);
    expect(f.size).toBe(9);
  });

  it('rejects empty files, files over 5 MB and types not allowed', () => {
    expect(() => FileContent.of('a.pdf', 'application/pdf', Buffer.alloc(0))).toThrow('empty');
    expect(() => FileContent.of('a.pdf', 'application/pdf', Buffer.alloc(FileContent.MAX_BYTES + 1))).toThrow('5 MB');
    expect(() => FileContent.of('a.exe', 'application/x-msdownload', Buffer.from('x'))).toThrow(DomainError);
  });
});

describe('Document aggregate (US35)', () => {
  it('adds a new version when a different file is uploaded with the same name', () => {
    const d = Document.create({ projectId: 'p1', name: 'Plan de pruebas', file: pdf('v1'), uploadedBy: 'u1' });
    const v2 = d.addVersion(pdf('v2', 'plan-v2.pdf'), 'u2');
    expect(v2.number).toBe(2);
    expect(d.versions.map((v) => v.storageKey)).toEqual([`${d.id}/v1`, `${d.id}/v2`]);
    expect(d.version(1).fileName).toBe('acta.pdf');
  });

  it('rejects uploading exactly the same content as the latest version', () => {
    const d = Document.create({ projectId: 'p1', name: 'Plan de pruebas', file: pdf('v1'), uploadedBy: 'u1' });
    expect(() => d.addVersion(pdf('v1'), 'u1')).toThrow(ConflictError);
  });
});

describe('Document Management application layer (US05, US21)', () => {
  let bus: InMemoryEventBus;
  let refs: InMemoryReferences;
  let requirements: InMemoryRequirements;
  let service: DocumentCommandService;

  beforeEach(async () => {
    bus = new InMemoryEventBus('document');
    refs = new InMemoryReferences();
    requirements = new InMemoryRequirements();
    new ReferenceSyncHandler(bus, refs).onModuleInit();
    service = new DocumentCommandService(new InMemoryDocuments(), requirements, refs, new InMemoryStorage(), bus);
    await bus.publish('projects.project-registered', { projectId: 'p1', name: 'ERP Logística', ownerId: 'owner', status: 'IN_PROGRESS' });
    await bus.publish('projects.milestone-added', { projectId: 'p1', milestoneId: 'm1', milestoneName: 'Go-live', status: 'PENDING' });
  });

  it('attaches a file to a task and announces the upload', async () => {
    const r = await service.handleUpload(new UploadDocumentCommand('p1', pdf('evidencia'), 'u1', 'Evidencia de pruebas', 't1'));
    expect(r.createdNewDocument).toBe(true);
    expect(r.document.taskId).toBe('t1');
    expect(bus.published.at(-1)!.type).toBe('documents.document-uploaded');
  });

  it('defines a mandatory document and fulfills it with the first upload', async () => {
    const req = await service.handleDefineRequirement(new DefineRequirementCommand('p1', 'm1', 'Acta de aceptación', undefined, 'owner'));
    expect(bus.published.at(-1)!.type).toBe('documents.requirement-defined');
    const r = await service.handleUpload(new UploadDocumentCommand('p1', pdf('acta firmada'), 'u1', undefined, undefined, undefined, req.id));
    expect(r.document.name).toBe('Acta de aceptación');
    expect(r.document.milestoneId).toBe('m1');
    expect(r.fulfilledRequirement?.id).toBe(req.id);
    expect(bus.published.map((e) => e.type)).toContain('documents.requirement-fulfilled');
    // a second version does not fulfill it again
    const again = await service.handleUpload(new UploadDocumentCommand('p1', pdf('acta corregida'), 'u1', undefined, undefined, undefined, req.id));
    expect(again.version.number).toBe(2);
    expect(again.fulfilledRequirement).toBeNull();
  });

  it('rejects duplicated requirements and unknown milestones', async () => {
    await service.handleDefineRequirement(new DefineRequirementCommand('p1', 'm1', 'Acta', undefined, 'owner'));
    await expect(service.handleDefineRequirement(new DefineRequirementCommand('p1', 'm1', 'Acta', undefined, 'owner'))).rejects.toBeInstanceOf(ConflictError);
    await expect(service.handleDefineRequirement(new DefineRequirementCommand('p1', 'mx', 'Acta', undefined, 'owner'))).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
