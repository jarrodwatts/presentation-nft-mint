import { ConnectButton } from "@/components/connect-button";
import { PresentationList } from "@/components/presentation-list";
import { AGWProvider } from "@/lib/providers";

export default function Home() {
  return (
    <AGWProvider>
      <main className="min-h-screen bg-background flex flex-col relative overflow-hidden font-body selection:bg-primary selection:text-black">


        <header className="fixed top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-40 bg-background/90 backdrop-blur-sm border-b border-white/5">
          <span className="text-xl md:text-2xl font-display font-bold tracking-tighter uppercase">Abstract<span className="text-primary">.</span></span>
          <ConnectButton />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 lg:px-8 xl:px-12 py-32 lg:py-24 min-h-screen">
          <PresentationList />
        </div>

        <footer className="hidden md:block fixed bottom-0 w-full p-6 text-center z-10 pointer-events-none">
          <a
            href="https://abs.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em] font-medium pointer-events-auto"
          >
            Built on Abstract
          </a>
        </footer>
      </main>
    </AGWProvider>
  );
}
