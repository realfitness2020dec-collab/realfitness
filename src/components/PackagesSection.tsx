import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const packages = [
  {
    name: "Gents Package",
    price: 1500,
    duration: "1 Month",
    features: ["Full Gym Access", "Locker Room", "Basic Training Guide", "Free Parking"],
    popular: false,
  },
  {
    name: "Ladies Package",
    price: 1200,
    duration: "1 Month",
    features: ["Full Gym Access", "Ladies Section", "Cardio Zone", "Yoga Classes"],
    popular: false,
  },
  {
    name: "Couple Package",
    price: 2500,
    duration: "1 Month",
    features: ["Full Gym Access", "Partner Workouts", "Diet Plan", "Personal Trainer"],
    popular: true,
  },
  {
    name: "Student Package",
    price: 800,
    duration: "1 Month",
    features: ["Full Gym Access", "Flexible Hours", "Study Break Sessions", "Valid ID Required"],
    popular: false,
  },
];

const PackagesSection = () => {
  return (
    <section className="relative overflow-hidden bg-card py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary))_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            New Year Offer - 20% Off
          </Badge>
          <h2 className="font-display text-4xl font-bold uppercase text-foreground md:text-5xl">
            Membership <span className="text-primary">Packages</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Choose the perfect plan for your fitness journey
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] ${
                pkg.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute right-0 top-0">
                  <div className="flex items-center gap-1 rounded-bl-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    <Star className="h-3 w-3" /> Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl uppercase text-foreground">
                  {pkg.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="font-display text-4xl font-bold text-primary">₹{pkg.price}</span>
                  <span className="text-muted-foreground">/{pkg.duration}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="mb-6 space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full transition-all hover:scale-105 ${
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Join Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
