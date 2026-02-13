import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavBar from "./components/navBar/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SINTA eSports",
  description: "Somos SINTA eSports",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="font-sans bg-black text-white antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
