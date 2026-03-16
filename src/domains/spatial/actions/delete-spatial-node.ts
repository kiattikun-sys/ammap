"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { requirePermission } from "@/lib/permissions/can-perform";

export async function deleteSpatialNode(id: string): Promise<void> {
  await requirePermission("delete:spatial_node");
  const db = (await createSupabaseServer()) as any;

  const { count, error: countError } = await db
    .from("spatial_nodes")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (countError) throw new Error(`deleteSpatialNode: ${countError.message}`);
  if ((count ?? 0) > 0) {
    throw new Error("Cannot delete node that has child nodes");
  }

  const { data, error } = await db
    .from("spatial_nodes")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) throw new Error(`deleteSpatialNode: ${error.message}`);
  if (!data) throw new Error(`SpatialNode "${id}" not found`);
}
