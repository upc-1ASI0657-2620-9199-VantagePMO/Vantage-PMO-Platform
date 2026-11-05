export class GetAllocationsByProjectQuery {
  constructor(public readonly projectId: string) {}
}

export class GetResourceAvailabilityQuery {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly minAvailable = 0,
  ) {}
}
