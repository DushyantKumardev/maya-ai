import { AppSidebar } from "@/features/sidebar/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SettingsProvider } from "@/features/settings/context/SettingsContext";
import { auth } from "@/features/auth/config/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <SettingsProvider>
      <SidebarProvider>
        <AppSidebar user={session?.user} />
        <SidebarInset className="flex flex-row w-full h-dvh overflow-hidden bg-background">
          <main
            className="relative flex flex-1 flex-col overflow-hidden"
            style={{ paddingBottom: "var(--keyboard-height)" }}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SettingsProvider>
  );
}
