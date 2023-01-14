import "./globals.css";
import NavBar from "./components/navBar/NavBar";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.jsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
