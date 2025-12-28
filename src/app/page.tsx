import { ConnectButton } from "@/components/connect-button";
import { PresentationList } from "@/components/presentation-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans selection:bg-primary/20">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <header className="fixed top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-50 bg-gradient-to-b from-background via-background/80 to-transparent backdrop-blur-[2px]">
        <span className="text-xl font-bold tracking-tighter">ABSTRACT</span>
        <ConnectButton />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 lg:px-8 xl:px-12 py-24 lg:py-16 min-h-screen">
        <PresentationList />
      </div>

      <footer className="fixed bottom-0 w-full p-6 text-center z-10 pointer-events-none">
        <a 
          href="https://abs.xyz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground/30 hover:text-primary transition-colors uppercase tracking-[0.2em] font-medium pointer-events-auto"
        >
          Built on Abstract
        </a>
      </footer>
    </main>
  );
}
