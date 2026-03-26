import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css"
//import Navbar from "@/components/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
//import { ClerkProvider } from "@clerk/nextjs";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export const metadata: Metadata = {
  title: "Proctor Exam Simulator",
  description: "Real-time Proctor Exam SimulatorPlatform",
};

export default async function Layout({ children, params }) {
  const { locale } = await params;
  console.log("locale=",locale);
  const messages = await getMessages(); // ✅ loads messages automatically

  return (
    <html lang={locale}>
      <body className={`${bricolage.variable} antialiased`}>
        {/*{<Navbar />}*/}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
