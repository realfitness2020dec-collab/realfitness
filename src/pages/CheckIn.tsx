import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Home, QrCode, CheckCircle, XCircle } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";

const CheckIn = () => {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ success: boolean; member?: { full_name: string; member_id: string; photo_url: string | null } } | null>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim()) return;
    
    setChecking(true);
    setResult(null);
    
    try {
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("id, full_name, member_id, photo_url, is_active, package_end_date")
        .eq("member_id", memberId.toUpperCase())
        .maybeSingle();

      if (memberError) throw memberError;
      
      if (!member) {
        setResult({ success: false });
        toast.error("Member not found!");
        return;
      }

      if (!member.is_active) {
        setResult({ success: false });
        toast.error("Membership is inactive!");
        return;
      }

      if (member.package_end_date && new Date(member.package_end_date) < new Date()) {
        setResult({ success: false });
        toast.error("Membership has expired!");
        return;
      }

      // Record attendance
      const { error: attendanceError } = await supabase.from("attendance").insert({
        member_id: member.id,
        qr_code_used: memberId.toUpperCase(),
      });

      if (attendanceError) throw attendanceError;

      setResult({ 
        success: true, 
        member: { full_name: member.full_name, member_id: member.member_id, photo_url: member.photo_url } 
      });
      toast.success(`Welcome, ${member.full_name}!`);
      setMemberId("");

      // Reset after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Check-in failed");
      setResult({ success: false });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={realFitnessLogo} alt="Real Fitness" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground">REAL FITNESS</h1>
              <p className="text-sm text-muted-foreground">Gym Check-In</p>
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
              <img src={realFitnessLogo} alt="Real Fitness" className="h-24 w-24 object-contain" />
            </div>
            <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              Member Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result ? (
              <div className={`text-center p-8 rounded-lg ${result.success ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {result.success ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    {result.member?.photo_url && (
                      <img src={result.member.photo_url} alt={result.member.full_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-green-500" />
                    )}
                    <h3 className="text-xl font-bold text-green-400">Check-In Successful!</h3>
                    <p className="text-foreground font-medium mt-2">{result.member?.full_name}</p>
                    <p className="text-primary font-mono">{result.member?.member_id}</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400">Check-In Failed</h3>
                    <p className="text-muted-foreground mt-2">Please try again or contact staff</p>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-foreground font-medium">Enter Member ID</label>
                  <Input
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    placeholder="e.g., RF0001"
                    className="bg-background border-border text-foreground text-center text-2xl font-mono tracking-widest py-6"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={checking || !memberId.trim()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                  {checking ? "Checking..." : "Check In"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckIn;