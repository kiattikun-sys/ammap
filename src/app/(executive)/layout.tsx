import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Header title="Executive" />
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
