"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";

export interface SubmitRegistrationRequestInput {
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  requestedOrgName: string;
  allowResubmit?: boolean;
}

const BLOCKED_STATUSES = ["pending", "approved", "invited", "activated"] as const;
const BLOCKED_STATUS_MESSAGES: Record<string, string> = {
  pending: "อีเมลนี้มีคำขอที่รอการพิจารณาอยู่แล้ว",
  approved: "อีเมลนี้ได้รับการอนุมัติแล้ว กรุณาตรวจสอบอีเมลของคุณ",
  invited: "อีเมลนี้ได้รับคำเชิญแล้ว กรุณาตรวจสอบอีเมลของคุณ",
  activated: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ",
};

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (!/^0\d{8,9}$/.test(digits)) {
    return "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 081-234-5678)";
  }
  return null;
}

export async function submitRegistrationRequest(
  input: SubmitRegistrationRequestInput
): Promise<{ id: string }> {
  const { email, fullName, companyName, phone, requestedOrgName, allowResubmit } = input;

  if (!email || !fullName || !requestedOrgName) {
    throw new Error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
  }

  // Validate phone format (optional field)
  if (phone?.trim()) {
    const phoneError = validatePhone(phone.trim());
    if (phoneError) throw new Error(phoneError);
  }

  // Normalize email at app layer (DB trigger also normalizes, defense-in-depth)
  const normalizedEmail = email.toLowerCase().trim();

  const db = createSupabaseAdmin() as any;

  // Check if previously rejected — inform user and allow re-registration
  if (!allowResubmit) {
    const { data: rejectedReq } = await db
      .from("registration_requests")
      .select("id, notes")
      .eq("email", normalizedEmail)
      .eq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rejectedReq) {
      const reason = rejectedReq.notes?.trim()
        ? `เหตุผล: ${rejectedReq.notes.trim()}`
        : "";
      throw new Error(`REJECTED:${reason}`);
    }
  }

  // Block duplicate submissions across all active lifecycle states
  const { data: existing } = await db
    .from("registration_requests")
    .select("id, status")
    .eq("email", normalizedEmail)
    .in("status", BLOCKED_STATUSES)
    .maybeSingle();

  if (existing) {
    throw new Error(
      BLOCKED_STATUS_MESSAGES[existing.status as string] ??
      "อีเมลนี้มีคำขออยู่แล้ว"
    );
  }

  const { data, error } = await db
    .from("registration_requests")
    .insert({
      email: normalizedEmail,
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

  // Audit log: submitted
  await db
    .from("registration_request_events")
    .insert({
      request_id: data.id,
      event_type: "submitted",
      performed_by: null,
      metadata: { email: normalizedEmail, resubmit: allowResubmit ?? false },
    });

  return { id: data.id };
}
