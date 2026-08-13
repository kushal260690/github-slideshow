import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { PreferencesProvider } from "@/components/Preferences";

export const metadata: Metadata = {
  metadataBase: new URL("https://gor-atlas.example.org"),
  title: {
    default: "Gor Atlas — The Living Encyclopedia of Banjara Heritage",
    template: "%s · Gor Atlas",
  },
  description:
    "A source-attributed geographic and cultural archive of the Gor/Banjara/Lambadi/Lambani community. Every Tanda. Every Clan. Every Story.",
  applicationName: "Gor Atlas",
  keywords: [
    "Banjara",
    "Lambadi",
    "Lambani",
    "Gor",
    "Gormati",
    "Tanda",
    "Sugali",
    "cultural archive",
    "oral history",
  ],
  openGraph: {
    title: "Gor Atlas — The Living Encyclopedia of Banjara Heritage",
    description: "Every Tanda. Every Clan. Every Story.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0f18",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applied before paint so a saved light/high-contrast preference does not
 * flash the dark default. Kept deliberately tiny.
 */
const THEME_INIT = `
try{var p=JSON.parse(localStorage.getItem('gor-atlas-prefs')||'{}');
document.documentElement.setAttribute('data-theme',p.theme==='light'?'light':'dark');
document.documentElement.setAttribute('data-contrast',p.highContrast?'high':'normal');
document.documentElement.setAttribute('data-lowdata',p.lowData?'on':'off');}catch(e){}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <PreferencesProvider>
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </PreferencesProvider>
      </body>
    </html>
  );
}
