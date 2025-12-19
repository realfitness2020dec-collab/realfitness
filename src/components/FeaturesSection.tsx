import { Dumbbell, Users, Clock, QrCode, Heart, Zap } from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Premium Equipment",
    description: "State-of-the-art machines and free weights for complete workouts",
  },
  {
    icon: Users,
    title: "Expert Trainers",
    description: "Certified personal trainers to guide your fitness journey",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Open early morning to late night for your convenience",
  },
  {
    icon: QrCode,
    title: "QR Attendance",
    description: "Quick check-in with our modern QR code attendance system",
  },
  {
    icon: Heart,
    title: "Health Tracking",
    description: "Monitor your progress with our integrated health tracking",
  },
  {
    icon: Zap,
    title: "High Energy",
    description: "Motivating atmosphere with pumping music and energy",
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
            Why Choose <span className="text-primary">Us</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Experience the difference at Real Fitness
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
