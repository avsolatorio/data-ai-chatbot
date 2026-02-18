import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { DataHeaderScript } from "@/components/data-header-script";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TokenLensProvider } from "@/components/tokenlens-provider";

import { cn } from "@/lib/utils";

import "@pcn-js/ui/styles.css";
import "./globals.css";
import { appConfig } from "@/lib/config";

const DATA_HEADER_ENABLED = /^(1|true|yes)$/i.test(
  process.env.NEXT_PUBLIC_DATA_HEADER_ENABLED?.trim() ?? "",
);

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.metadata.baseUrl),
  title: appConfig.metadata.title,
  description: appConfig.metadata.description,
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// Configure fonts with fallback for Docker builds where Google Fonts may be unreachable
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
  fallback: ["monospace"],
});

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
  fallback: ["system-ui", "arial"],
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable} ${figtree.variable} h-dvh overflow-hidden`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body
        className={cn(
          "antialiased flex h-full flex-col overflow-hidden",
          !DATA_HEADER_ENABLED && "data-header-disabled",
        )}
      >
        {DATA_HEADER_ENABLED && (
          <div className="data-header-wrapper shrink-0">
            <header className="data-header" />
            <DataHeaderScript />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
              enableSystem
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <Toaster position="top-center" />
                <DataStreamProvider>
                  <TokenLensProvider>{children}</TokenLensProvider>
                </DataStreamProvider>
              </div>
            </ThemeProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
