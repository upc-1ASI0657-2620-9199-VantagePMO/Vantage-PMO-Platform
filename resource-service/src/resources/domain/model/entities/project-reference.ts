/** Local replica of a project, owned by Project & Task and kept in sync through projects.* events. */
export interface ProjectReference {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  startDate: string;
  endDate: string;
}

export const isProjectClosed = (p: ProjectReference): boolean => p.status === 'COMPLETED' || p.status === 'CANCELLED';
