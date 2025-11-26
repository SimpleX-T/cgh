import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
// import { AiChatAssistant } from "@/components/ai-chat-assistant";
import { RegisterModal } from "@/components/RegisterModal";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Toaster } from "sonner";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "Celo Game Hub",
  description: "A collection of classic games with AI-powered features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased ${orbitron.variable}`}>
        <WalletProvider>
          {children}
          <Toaster
            richColors
            position="top-right"
            duration={5000}
            // closeButton
          />
          <RegisterModal />
          {/* <AiChatAssistant /> */}
        </WalletProvider>
      </body>
    </html>
  );
}
