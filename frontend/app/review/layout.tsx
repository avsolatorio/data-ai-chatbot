import type { Metadata } from "next";
import { PcnProviderClient } from "@/components/data360/pcn-provider-client";
import { HomeConfigProvider } from "@/components/home-config-provider";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `Review | ${appConfig.metadata.title}`,
  description: "Review and moderate user feedback. Access is restricted to designated reviewers.",
  robots: "noindex, nofollow",
};

export default function ReviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PcnProviderClient>
      <HomeConfigProvider>{children}</HomeConfigProvider>
    </PcnProviderClient>
  );
}
