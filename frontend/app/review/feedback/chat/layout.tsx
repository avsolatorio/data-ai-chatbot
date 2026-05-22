import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Chat UI expects SidebarProvider. Use SidebarInset (no AppSidebar) so content spans full width.
 */
export default function ReviewFeedbackChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="h-dvh w-full" defaultOpen={false}>
      <SidebarInset className="flex h-full min-h-0 w-full flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
