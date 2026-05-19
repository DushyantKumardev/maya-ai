import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";
import { PlaybackProvider } from "@/features/chat/context/PlaybackContext";
import { LocationProvider } from "@/features/chat/context/LocationContext";
import { cn } from "@/lib/utils/utils";
import VirtualKeyboardHandler from "@/components/common/VirtualKeyboardHandler";
import { APP_NAME, } from "@/lib/constants";


const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-app",
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Advanced AI Chat Companion`,
  description:
    `Experience next-generation AI conversations with ${APP_NAME}. Powerful, intelligent, and designed for your workflow.`,
  icons: {
    icon: "/favicon.svg",
  },
};


import { AuthProvider } from "@/components/providers/AuthProvider";
import { auth } from "@/features/auth/config/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, "font-sans antialiased")}>
        <AuthProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocationProvider>
              <PlaybackProvider>
                {children}
                <VirtualKeyboardHandler />
                <Toaster position="top-right" richColors theme={"system"} />
              </PlaybackProvider>
            </LocationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
