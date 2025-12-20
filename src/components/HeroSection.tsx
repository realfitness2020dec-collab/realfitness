import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Clock, Dumbbell, Shield, User } from "lucide-react";
import gymHero from "@/assets/gym-hero.jpg";
import realFitnessLogo from "@/assets/real-fitness-logo.png";

const HeroSection = () => {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, delay: Math.random() * 5 })));
  }, []);

  const stats = [
    { icon: Users, value: "500+", label: "Active Members" },
    { icon: Dumbbell, value: "50+", label: "Equipment" },
    { icon: Trophy, value: "10+", label: "Years Experience" },
    { icon: Clock, value: "24/7", label: "Open Hours" },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={gymHero} alt="Real Fitness Gym" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      {particles.map((p) => <div key={p.id} className="absolute h-2 w-2 rounded-full bg-primary/30 animate-float" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.delay}s` }} />)}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-8"><img src={realFitnessLogo} alt="Real Fitness Logo" className="h-48 w-48 md:h-64 md:w-64 object-contain" /></div>
        <h1 className="font-display text-5xl font-black uppercase tracking-wider text-foreground md:text-7xl">Real <span className="text-primary">Fitness</span></h1>
        <p className="font-display text-xl tracking-[0.3em] text-primary md:text-2xl mb-8">BLACK SQUAD</p>
        <p className="mb-12 max-w-2xl text-xl text-muted-foreground md:text-2xl">Transform Your Body, Transform Your Life</p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" onClick={() => navigate("/admin")} className="gap-2 bg-primary px-8 py-6 text-lg font-bold text-primary-foreground hover:bg-primary/90"><Shield className="h-5 w-5" />Admin Login</Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/member")} className="gap-2 border-primary px-8 py-6 text-lg font-bold text-primary hover:bg-primary hover:text-primary-foreground"><User className="h-5 w-5" />Member Login</Button>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => <div key={i} className="group flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm hover:border-primary"><stat.icon className="mb-2 h-8 w-8 text-primary" /><span className="font-display text-3xl font-bold text-foreground">{stat.value}</span><span className="text-sm text-muted-foreground">{stat.label}</span></div>)}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;