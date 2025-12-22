import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const startScanner = async () => {
      if (!containerRef.current || isStarted) return;

      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors (no QR found in frame)
          }
        );
        setIsStarted(true);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Failed to start camera");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isStarted) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan, onError, isStarted]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default QRScanner;
