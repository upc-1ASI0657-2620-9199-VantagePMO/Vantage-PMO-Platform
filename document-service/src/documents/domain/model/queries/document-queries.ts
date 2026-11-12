export class GetProjectDocumentsQuery {
  constructor(public readonly projectId: string, public readonly taskId?: string, public readonly milestoneId?: string) {}
}

export class GetDocumentQuery {
  constructor(public readonly documentId: string) {}
}

export class GetDocumentContentQuery {
  constructor(public readonly documentId: string, public readonly version?: number) {}
}

export class GetMilestoneRequirementsQuery {
  constructor(public readonly projectId: string, public readonly milestoneId: string) {}
}
