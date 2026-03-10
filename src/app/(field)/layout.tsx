import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";

export default function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Header title="Field" />
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
