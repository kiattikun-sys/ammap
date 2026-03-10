import type { Inspection } from "../model/inspection";
import type { Defect, DefectStatus } from "../model/defect";
import { getInspection } from "../queries/get-inspection";
import { listInspections, type ListInspectionsFilter } from "../queries/list-inspections";
import { getDefect } from "../queries/get-defect";
import { listDefects, type ListDefectsFilter } from "../queries/list-defects";
import { listDefectsBySpatialNode } from "../queries/list-defects-by-spatial-node";
import type { CreateInspectionInput } from "../validation/create-inspection-schema";
import type { CreateDefectInput } from "../validation/create-defect-schema";

export class QualityService {
  async createInspection(
    projectId: string,
    input: CreateInspectionInput
  ): Promise<Inspection> {
    const { createInspection } = await import("../actions/create-inspection");
    return createInspection(projectId, input);
  }

  async createDefect(
    projectId: string,
    input: CreateDefectInput
  ): Promise<Defect> {
    const { createDefect } = await import("../actions/create-defect");
    return createDefect(projectId, input);
  }

  async updateDefectStatus(
    id: string,
    status: DefectStatus
  ): Promise<Defect> {
    const { updateDefectStatus } = await import("../actions/update-defect-status");
    return updateDefectStatus(id, status);
  }

  async deleteDefect(id: string): Promise<void> {
    const { deleteDefect } = await import("../actions/delete-defect");
    return deleteDefect(id);
  }

  async listDefectsByZone(spatialNodeId: string): Promise<Defect[]> {
    return listDefectsBySpatialNode(spatialNodeId);
  }

  async listDefects(filter: ListDefectsFilter): Promise<Defect[]> {
    return listDefects(filter);
  }

  async listInspections(filter: ListInspectionsFilter): Promise<Inspection[]> {
    return listInspections(filter);
  }

  async getInspection(id: string): Promise<Inspection | null> {
    return getInspection(id);
  }

  async getDefect(id: string): Promise<Defect | null> {
    return getDefect(id);
  }
}

export const qualityService = new QualityService();
