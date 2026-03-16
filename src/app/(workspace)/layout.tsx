import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName, organizationName, initial } = await getCurrentUserContext();

  return (
    <AppShell>
      <Header
        title="Workspace"
        username={displayName || undefined}
        organization={organizationName}
        initial={initial || undefined}
      />
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
