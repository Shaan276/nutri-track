import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";

export const viewport: Viewport = {
  themeColor: "#0E121A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Nutri-Track — Health OS",
  description: "Modern, minimal, high-precision health & nutrition operating system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nutri-Track",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-midnight text-foreground-primary antialiased min-h-screen selection:bg-brand-500/30 selection:text-white">
        <AuthProvider>
          <QueryProvider>
            <OfflineIndicator />
            {children}
          </QueryProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
