import { Dumbbell, Users, Clock, QrCode, Heart, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Personal Trainer",
    description: "Our core feature! Get daily, personalized workout plans from our AI coach, tailored to your goals.",
  },
  {
    icon: Heart,
    title: "Digital Progress Tracking",
    description: "Monitor your gains, weight, and performance with our integrated digital tracking system.",
  },
  {
    icon: Dumbbell,
    title: "Premium Equipment",
    description: "State-of-the-art machines and free weights for the best workout in Kunnathur.",
  },
  {
    icon: QrCode,
    title: "Seamless Digital Check-in",
    description: "Quick and easy QR code entry, making your gym access effortless and modern.",
  },
  {
    icon: Users,
    title: "Kunnathur's #1 Fitness Community",
    description: "Join a motivating community at the best gym in Kunnathur, both online and offline.",
  },
  {
    icon: Clock,
    title: "Flexible Hours for Kunnathur",
    description: "Open early mornings and late nights to fit the busiest schedules.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold uppercase text-foreground md:text-5xl">
            The Future of Fitness at <span className="text-primary">Kunnathur's Best Gym</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Discover the advantages of our AI-Powered Digital Gym experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-card/80 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
            >
              {/* Icon */}
              <div className="mb-6 inline-flex rounded-lg bg-primary/10 p-4 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>

              {/* Hover Effect */}
              <div className="absolute -bottom-2 -right-2 h-20 w-20 rounded-full bg-primary/5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-150" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;