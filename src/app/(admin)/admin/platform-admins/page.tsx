import { requirePlatformAdminPage } from "@/lib/platform/assert-platform-admin";
import { listPlatformAdmins } from "@/domains/platform/queries/list-platform-admins";
import { PlatformAdminsClient } from "./platform-admins-client";

export default async function PlatformAdminsPage() {
  const ctx = await requirePlatformAdminPage();
  const admins = await listPlatformAdmins();

  return (
    <PlatformAdminsClient
      admins={admins}
      callerRole={ctx.role}
      callerId={ctx.userId}
    />
  );
}
