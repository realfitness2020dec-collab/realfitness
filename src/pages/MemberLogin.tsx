import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, ArrowLeft, Lock } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";

const MemberLogin = () => {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedMemberId = memberId.trim().toUpperCase();
      const normalizedPassword = password.trim();

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          await supabase.auth.signOut({ scope: "local" });
        }
      }

      const { data, error } = await supabase.functions.invoke("member-login", {
        body: {
          member_id: normalizedMemberId,
          password: normalizedPassword || undefined,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Login failed. Please check Member ID and password.");
        return;
      }

      const member = data.member;
      localStorage.setItem("member", JSON.stringify(member));
      toast.success(`Welcome back, ${member.full_name}!`);
      navigate("/member/portal");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="flex justify-center">
          <img src={realFitnessLogo} alt="Real Fitness" className="h-40 w-40 object-contain animate-bounce-in" />
        </div>

        <Card className="bg-card border-border animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">
              MEMBER LOGIN
            </CardTitle>
            <p className="text-muted-foreground">Enter your Member ID and password to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="memberId" className="text-foreground">Member ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="memberId"
                    placeholder="e.g., RF0001"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    className="pl-10 bg-background border-border text-foreground uppercase tracking-wider"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password set by admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  If admin set a password for your account, login will work only with that password.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have a Member ID? <span className="text-primary">Contact the gym to register</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberLogin;
