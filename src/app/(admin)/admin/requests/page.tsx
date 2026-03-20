import { requirePlatformAdminPage } from "@/lib/platform/assert-platform-admin";
import { listRegistrationRequests } from "@/domains/platform/actions/list-registration-requests";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requirePlatformAdminPage();

  const statusFilter = (searchParams.status as "pending" | "approved" | "invited" | "activated" | "rejected" | "all") ?? "pending";
  const requests = await listRegistrationRequests(statusFilter);

  return <RequestsClient requests={requests} currentFilter={statusFilter} />;
}
