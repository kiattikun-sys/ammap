import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { getOrgMembers } from "@/domains/org/actions/get-org-members";
import { MembersClient } from "./members-client";

export default async function OrgMembersPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { org, members, currentUserRole } = await getOrgMembers();

  if (!org || !currentUserRole) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-500">คุณยังไม่ได้เป็นสมาชิกขององค์กรใด</p>
      </div>
    );
  }

  if (currentUserRole !== "owner" && currentUserRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <MembersClient
      members={members}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
      orgName={org.name}
    />
  );
}
