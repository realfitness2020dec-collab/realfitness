import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, CheckCircle, XCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/services/supabase";
import QRScanner from "./QRScanner";

interface MemberQRScannerProps {
  member: Member;
  onSuccess?: () => void;
}

const MemberQRScanner = ({ member, onSuccess }: MemberQRScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleScan = useCallback(async (scannedCode: string) => {
    if (checking || result) return;
    
    // Validate the QR code format (should be RFGYM-DATE-RANDOM)
    if (!scannedCode.startsWith("RFGYM-")) {
      setResult({ success: false, message: "Invalid gym QR code" });
      setTimeout(() => setResult(null), 3000);
      return;
    }

    setChecking(true);
    
    try {
      // Use edge function to record attendance (bypasses RLS)
      const { data, error } = await supabase.functions.invoke("member-checkin", {
        body: { member_id: member.id, qr_code_used: scannedCode },
      });

      if (error || data?.error) {
        const errorMsg = data?.error || "Check-in failed";
        setResult({ success: false, message: errorMsg });
        toast.error(errorMsg);
        setTimeout(() => setResult(null), 3000);
        return;
      }

      setResult({ success: true, message: "Check-in successful!" });
      toast.success("Welcome! Attendance recorded.");
      
      // Close dialog and refresh after success
      setTimeout(() => {
        setResult(null);
        setIsOpen(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setResult({ success: false, message: "Check-in failed. Try again." });
      toast.error("Check-in failed");
      setTimeout(() => setResult(null), 3000);
    } finally {
      setChecking(false);
    }
  }, [member, checking, result, onSuccess]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Mark Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-muted-foreground text-center mb-4">
          Scan the gym's QR code displayed at the entrance to mark your attendance
        </p>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <QrCode className="h-5 w-5" />
              Scan to Check-In
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Scan Gym QR Code
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {result ? (
                <div className={`text-center p-8 rounded-lg ${result.success ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {result.success ? (
                    <>
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-400">{result.message}</h3>
                      <p className="text-muted-foreground mt-2">Welcome, {member.full_name}!</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-400">{result.message}</h3>
                      <p className="text-muted-foreground mt-2">Please try again or contact staff</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <QRScanner 
                    onScan={handleScan}
                    onError={(error) => toast.error(error)}
                  />
                  <p className="text-center text-muted-foreground text-sm">
                    Point your camera at the gym's QR code
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MemberQRScanner;