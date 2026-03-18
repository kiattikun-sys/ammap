"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export interface SubmitRegistrationRequestInput {
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  requestedOrgName: string;
}

export async function submitRegistrationRequest(
  input: SubmitRegistrationRequestInput
): Promise<{ id: string }> {
  const { email, fullName, companyName, phone, requestedOrgName } = input;

  if (!email || !fullName || !requestedOrgName) {
    throw new Error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
  }

  const db = await createSupabaseServer();

  // Check for duplicate pending request from same email
  const { data: existing } = await (db as any)
    .from("registration_requests")
    .select("id, status")
    .eq("email", email.toLowerCase().trim())
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") {
      throw new Error("อีเมลนี้ได้รับการอนุมัติแล้ว กรุณาเข้าสู่ระบบ");
    }
    throw new Error("อีเมลนี้มีคำขอที่รอการพิจารณาอยู่แล้ว");
  }

  const { data, error } = await (db as any)
    .from("registration_requests")
    .insert({
      email: email.toLowerCase().trim(),
      full_name: fullName.trim(),
      company_name: companyName?.trim() || null,
      phone: phone?.trim() || null,
      requested_org_name: requestedOrgName.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง");
  }

  return { id: data.id };
}
