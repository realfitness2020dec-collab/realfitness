import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dumbbell, Users, Trophy, Clock } from "lucide-react";
import gymHero from "@/assets/gym-hero.jpg";

const HeroSection = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const stats = [
    { icon: Users, value: "500+", label: "Active Members" },
    { icon: Dumbbell, value: "50+", label: "Equipment" },
    { icon: Trophy, value: "10+", label: "Years Experience" },
    { icon: Clock, value: "24/7", label: "Open Hours" },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={gymHero}
          alt="Real Fitness Gym"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Animated Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute h-2 w-2 rounded-full bg-primary/30 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Brand Logo */}
        <div className="mb-8 animate-pulse-glow">
          <div className="flex items-center gap-4">
            <Dumbbell className="h-16 w-16 text-primary animate-bounce-subtle" />
            <div>
              <h1 className="font-display text-5xl font-black uppercase tracking-wider text-foreground md:text-7xl">
                Real <span className="text-primary">Fitness</span>
              </h1>
              <p className="font-display text-xl tracking-[0.3em] text-primary md:text-2xl">
                BLACK SQUAD
              </p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="mb-12 max-w-2xl text-xl text-muted-foreground md:text-2xl animate-slide-up">
          Transform Your Body, Transform Your Life
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            size="lg"
            className="bg-primary px-8 py-6 text-lg font-bold text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          >
            Member Login
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary px-8 py-6 text-lg font-bold text-primary transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
          >
            Admin Login
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary hover:bg-card/80"
            >
              <stat.icon className="mb-2 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <span className="font-display text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="h-14 w-8 rounded-full border-2 border-primary/50 p-2">
          <div className="h-3 w-3 rounded-full bg-primary animate-scroll-down" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
