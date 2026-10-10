import { Task } from '../model/aggregates/task';

export abstract class TaskRepository {
  abstract save(task: Task): Promise<void>;
  abstract findById(id: string): Promise<Task | null>;
  abstract findByProjectId(projectId: string): Promise<Task[]>;
}
