import type { WorkItem } from "../model/work-item";
import { getWorkItem } from "../queries/get-work-item";
import { listWorkItems, type ListWorkItemsFilter } from "../queries/list-work-items";
import { listWorkItemsBySpatialNode } from "../queries/list-work-items-by-spatial-node";
import type { CreateWorkItemInput } from "../validation/create-work-item-schema";
import type { UpdateWorkItemInput } from "../actions/update-work-item";

export class WorkService {
  async createTask(
    projectId: string,
    input: CreateWorkItemInput
  ): Promise<WorkItem> {
    const { createWorkItem } = await import("../actions/create-work-item");
    return createWorkItem(projectId, input);
  }

  async updateTask(id: string, input: UpdateWorkItemInput): Promise<WorkItem> {
    const { updateWorkItem } = await import("../actions/update-work-item");
    return updateWorkItem(id, input);
  }

  async deleteTask(id: string): Promise<void> {
    const { deleteWorkItem } = await import("../actions/delete-work-item");
    return deleteWorkItem(id);
  }

  async updateProgress(id: string, progress: number): Promise<WorkItem> {
    const { updateWorkProgress } = await import("../actions/update-work-progress");
    return updateWorkProgress(id, progress);
  }

  async listTasksByZone(spatialNodeId: string): Promise<WorkItem[]> {
    return listWorkItemsBySpatialNode(spatialNodeId);
  }

  async listTasks(filter: ListWorkItemsFilter): Promise<WorkItem[]> {
    return listWorkItems(filter);
  }

  async getTask(id: string): Promise<WorkItem | null> {
    return getWorkItem(id);
  }
}

export const workService = new WorkService();
