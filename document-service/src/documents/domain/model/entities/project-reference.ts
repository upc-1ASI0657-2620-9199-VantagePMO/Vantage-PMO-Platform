/** Local replicas owned by Project & Task, kept in sync through projects.* events. */
export interface ProjectReference {
  id: string;
  name: string;
  ownerId: string;
  status: string;
}

export interface MilestoneReference {
  id: string;
  projectId: string;
  name: string;
  status: string;
}
