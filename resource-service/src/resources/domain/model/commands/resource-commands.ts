export class AllocateMemberCommand {
  constructor(
    public readonly projectId: string,
    public readonly memberId: string,
    public readonly role: string,
    public readonly percentage: number,
    public readonly startDate: string,
    public readonly endDate: string,
    public readonly assignedBy: string,
  ) {}
}

export class ChangeAllocationCommand {
  constructor(
    public readonly allocationId: string,
    public readonly role?: string,
    public readonly percentage?: number,
    public readonly startDate?: string,
    public readonly endDate?: string,
  ) {}
}

export class ReleaseAllocationCommand {
  constructor(public readonly allocationId: string) {}
}
