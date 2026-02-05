import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { membersService } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, ArrowLeft } from "lucide-react";
import realFitnessLogo from "@/assets/real-fitness-logo.png";

const MemberLogin = () => {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const member = await membersService.getByMemberId(memberId);

      if (!member) {
        toast.error("Member ID not found. Please check and try again.");
        return;
      }

      if (!member.is_active) {
        toast.error("Your membership is inactive. Please contact the gym.");
        return;
      }

      // Store member info in session storage for member portal
      sessionStorage.setItem("member", JSON.stringify(member));
      toast.success(`Welcome back, ${member.full_name}!`);
      navigate("/member/portal");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={realFitnessLogo} 
            alt="Real Fitness" 
            className="h-40 w-40 object-contain animate-bounce-in"
          />
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">
              MEMBER LOGIN
            </CardTitle>
            <p className="text-muted-foreground">Enter your Member ID to continue</p>
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
                Don't have a Member ID?{" "}
                <span className="text-primary">Contact the gym to register</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberLogin;
