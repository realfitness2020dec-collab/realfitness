import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("install-dismissed", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <div className="max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg p-4">
        {showIOSGuide ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Install on iPhone/iPad
              </h3>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li>1. Tap the <strong className="text-foreground">Share</strong> button (📤) at the bottom of Safari</li>
              <li>2. Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></li>
              <li>3. Tap <strong className="text-foreground">"Add"</strong> to install</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-primary/10 rounded-lg p-2">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Install Real Fitness</p>
              <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-muted-foreground">
                Later
              </Button>
              <Button size="sm" onClick={handleInstall} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Install
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
