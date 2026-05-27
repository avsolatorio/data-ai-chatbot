import { Open_Sans } from "next/font/google";
import "@/components/mcp-docs/mcp-docs-theme.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${openSans.className} min-h-0 flex-1 overflow-y-auto`}>
      {children}
    </div>
  );
}
