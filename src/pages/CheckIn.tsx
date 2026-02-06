import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home, QrCode, Lock, RefreshCw, Download } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";

const ADMIN_PASSWORD = "siva$blacksquad";

// Generate a unique session code for today
const generateDailyCode = () => {
  const today = new Date().toISOString().split('T')[0];
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RFGYM-${today}-${random}`;
};

const CheckIn = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [qrCode, setQrCode] = useState("");
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for stored QR code for today
    const storedCode = sessionStorage.getItem("gymQRCode");
    const storedDate = sessionStorage.getItem("gymQRDate");
    const today = new Date().toISOString().split('T')[0];

    if (storedCode && storedDate === today) {
      setQrCode(storedCode);
    } else {
      const newCode = generateDailyCode();
      setQrCode(newCode);
      sessionStorage.setItem("gymQRCode", newCode);
      sessionStorage.setItem("gymQRDate", today);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      setPassword("");
    }
  };

  const regenerateCode = () => {
    const newCode = generateDailyCode();
    setQrCode(newCode);
    sessionStorage.setItem("gymQRCode", newCode);
    sessionStorage.setItem("gymQRDate", new Date().toISOString().split('T')[0]);
  };

  const downloadQR = () => {
    const svgElement = qrContainerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const canvas = document.createElement("canvas");
    const size = 400;
    const padding = 60;
    const logoSize = 60;
    const totalSize = size + padding * 2;
    canvas.width = totalSize;
    canvas.height = totalSize + 50; // extra space for text
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code from SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, padding, padding, size, size);
      URL.revokeObjectURL(svgUrl);

      // Draw logo on top of QR center
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoX = padding + (size - logoSize) / 2;
        const logoY = padding + (size - logoSize) / 2;
        // White circle behind logo
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        // Add text below QR
        ctx.fillStyle = "#333333";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("REAL FITNESS - Scan to Check-In", canvas.width / 2, size + padding + 30);
        ctx.font = "14px Arial";
        ctx.fillStyle = "#666666";
        ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, size + padding + 50);

        // Download
        const link = document.createElement("a");
        link.download = `RealFitness-QR-${new Date().toISOString().split("T")[0]}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      logoImg.onerror = () => {
        // Download without logo if logo fails to load
        ctx.fillStyle = "#333333";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("REAL FITNESS - Scan to Check-In", canvas.width / 2, size + padding + 30);
        const link = document.createElement("a");
        link.download = `RealFitness-QR-${new Date().toISOString().split("T")[0]}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      logoImg.src = realFitnessLogo;
    };
    qrImg.src = svgUrl;
  };

  // Password gate screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b border-border p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={realFitnessLogo} alt="Real Fitness" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-foreground">REAL FITNESS</h1>
                <p className="text-sm text-muted-foreground">Attendance QR</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="bg-card border-border w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-foreground">Admin Access Required</CardTitle>
              <p className="text-muted-foreground mt-2">Enter password to display attendance QR</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-background border-border text-foreground text-center text-lg py-6"
                  autoFocus
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                  Unlock
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={realFitnessLogo} alt="Real Fitness" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground">REAL FITNESS</h1>
              <p className="text-sm text-muted-foreground">Attendance QR Display</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="bg-card border-border w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={realFitnessLogo} alt="Real Fitness" className="h-20 w-20 object-contain" />
            </div>
            <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              Scan to Check-In
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Members scan this QR code using their portal to mark attendance
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div ref={qrContainerRef} className="bg-white p-6 rounded-xl shadow-lg">
                <QRCodeSVG value={qrCode} size={280} level="H" />
              </div>
              <p className="text-primary font-mono text-lg font-bold mt-4">{qrCode}</p>
              <p className="text-muted-foreground text-sm mt-2">
                Code valid for: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={regenerateCode}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Code
              </Button>
              <Button 
                onClick={downloadQR}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Display this screen at the gym entrance</li>
                <li>Members open their portal and tap "Scan to Check-In"</li>
                <li>They scan this QR code with their camera</li>
                <li>Attendance is automatically recorded</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckIn;