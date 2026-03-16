"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { requirePermission } from "@/lib/permissions/can-perform";

export async function deleteWorkItem(id: string): Promise<void> {
  await requirePermission("delete:work_item");

  const db = (await createSupabaseServer()) as any;

  const { error } = await db
    .from("work_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteWorkItem: ${error.message}`);
}
