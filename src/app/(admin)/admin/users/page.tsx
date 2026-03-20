import { requirePlatformAdminPage } from "@/lib/platform/assert-platform-admin";
import { listPlatformUsers } from "@/domains/platform/queries/list-platform-users";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const ctx = await requirePlatformAdminPage();
  const users = await listPlatformUsers();
  return (
    <UsersClient
      users={users}
      callerRole={ctx.role}
      callerId={ctx.userId}
    />
  );
}
