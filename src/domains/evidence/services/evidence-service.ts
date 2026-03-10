import type { Evidence } from "../model/evidence";
import { getEvidence } from "../queries/get-evidence";
import { listEvidence, type ListEvidenceFilter } from "../queries/list-evidence";
import { listEvidenceBySpatialNode } from "../queries/list-evidence-by-spatial-node";
import { listEvidenceByDefect } from "../queries/list-evidence-by-defect";
import { listEvidenceByWorkItem } from "../queries/list-evidence-by-work-item";
import type { CreateEvidenceInput } from "../validation/create-evidence-schema";

export class EvidenceService {
  async createEvidence(
    projectId: string,
    input: CreateEvidenceInput
  ): Promise<Evidence> {
    const { createEvidence } = await import("../actions/create-evidence");
    return createEvidence(projectId, input);
  }

  async deleteEvidence(id: string): Promise<void> {
    const { deleteEvidence } = await import("../actions/delete-evidence");
    return deleteEvidence(id);
  }

  async listEvidenceByZone(spatialNodeId: string): Promise<Evidence[]> {
    return listEvidenceBySpatialNode(spatialNodeId);
  }

  async listEvidenceByDefect(defectId: string): Promise<Evidence[]> {
    return listEvidenceByDefect(defectId);
  }

  async listEvidenceByWorkItem(workItemId: string): Promise<Evidence[]> {
    return listEvidenceByWorkItem(workItemId);
  }

  async listEvidence(filter: ListEvidenceFilter): Promise<Evidence[]> {
    return listEvidence(filter);
  }

  async getEvidence(id: string): Promise<Evidence | null> {
    return getEvidence(id);
  }
}

export const evidenceService = new EvidenceService();
