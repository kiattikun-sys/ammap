import { requirePlatformAdminPage } from "@/lib/platform/assert-platform-admin";
import { listPlatformOrganizations } from "@/domains/platform/queries/list-platform-organizations";
import { OrganizationsClient } from "./organizations-client";

export default async function OrganizationsPage() {
  await requirePlatformAdminPage();
  const orgs = await listPlatformOrganizations();
  return <OrganizationsClient orgs={orgs} />;
}
