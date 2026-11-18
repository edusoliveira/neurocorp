"use client";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CelebracaoProvider } from "./celebracao";
import { Atalhos } from "./atalhos";
import { SubmissaoProvider } from "./submeter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <SWRConfig value={{ revalidateOnFocus: true, keepPreviousData: true }}>
        <TooltipProvider delay={200}>
          <CelebracaoProvider>
            <SubmissaoProvider>
              {children}
              <Atalhos />
            </SubmissaoProvider>
          </CelebracaoProvider>
          <Toaster position="bottom-right" richColors />
        </TooltipProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
