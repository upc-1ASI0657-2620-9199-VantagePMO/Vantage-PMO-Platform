import { FileContent } from '../value-objects/file-content';

export class UploadDocumentCommand {
  constructor(
    public readonly projectId: string,
    public readonly file: FileContent,
    public readonly uploadedBy: string,
    public readonly name?: string,
    public readonly taskId?: string,
    public readonly milestoneId?: string,
    public readonly requirementId?: string,
  ) {}
}

export class DefineRequirementCommand {
  constructor(
    public readonly projectId: string,
    public readonly milestoneId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly definedBy: string,
  ) {}
}

export class RemoveRequirementCommand {
  constructor(public readonly requirementId: string) {}
}
