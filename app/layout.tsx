import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Rajdhani, Orbitron } from "next/font/google";

import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "SINTA eSports | Sim Racing Team",
  description:
    "Equipo de sim racing competitivo con enfoque en estrategia, rendimiento y trabajo en equipo.",
  keywords: ["sim racing", "esports", "SINTA", "motorsport", "racing team"],
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className="dark">
      <body className={`${rajdhani.variable} ${orbitron.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
