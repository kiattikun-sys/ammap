import type { SpatialNode } from "../model/spatial-node";
import type { SpatialGeometry } from "../model/spatial-geometry";
import { MOCK_SPATIAL_GEOMETRIES } from "../model/mock-spatial-data";
import { getSpatialTree, type SpatialTreeNode } from "../queries/get-spatial-tree";
import { listSpatialNodes } from "../queries/list-spatial-nodes";
import { getSpatialNode } from "../queries/get-spatial-node";
import type { CreateSpatialNodeInput } from "../validation/create-spatial-node-schema";
import type { UpdateSpatialNodeInput } from "../actions/update-spatial-node";

export class SpatialService {
  async getSpatialTree(projectId: string): Promise<SpatialTreeNode[]> {
    return getSpatialTree(projectId);
  }

  async getNode(id: string): Promise<SpatialNode | null> {
    return getSpatialNode(id);
  }

  async listZones(projectId: string): Promise<SpatialNode[]> {
    return listSpatialNodes({ projectId, type: "zone" });
  }

  async listByType(
    projectId: string,
    type: SpatialNode["type"]
  ): Promise<SpatialNode[]> {
    return listSpatialNodes({ projectId, type });
  }

  async getGeometry(geometryId: string): Promise<SpatialGeometry | null> {
    return MOCK_SPATIAL_GEOMETRIES.find((g) => g.id === geometryId) ?? null;
  }

  async createNode(
    projectId: string,
    input: CreateSpatialNodeInput
  ): Promise<SpatialNode> {
    // Dynamically import server action to avoid bundling "use server" in client paths
    const { createSpatialNode } = await import("../actions/create-spatial-node");
    return createSpatialNode(projectId, input);
  }

  async updateNode(
    id: string,
    input: UpdateSpatialNodeInput
  ): Promise<SpatialNode> {
    const { updateSpatialNode } = await import("../actions/update-spatial-node");
    return updateSpatialNode(id, input);
  }

  async deleteNode(id: string): Promise<void> {
    const { deleteSpatialNode } = await import("../actions/delete-spatial-node");
    return deleteSpatialNode(id);
  }
}

export const spatialService = new SpatialService();
