import { Dumbbell, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/50 bg-card">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50" />

      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Real <span className="text-primary">Fitness</span>
                </h3>
                <p className="text-xs tracking-wider text-primary">AI-POWERED GYM</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Welcome to the best gym in Kunnathur. As a leading AI-powered digital gym, we offer a unique fitness experience. Owned & operated by <span className="text-primary font-medium">Siva</span>.
            </p>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Visit Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Kunnathur, Tamil Nadu
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +91 8248756157
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                realfitness2020dec@gmail.com
              </li>
            </ul>
          </div>

          {/* Our Features */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Our Features</h4>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">AI-Powered Workouts</li>
              <li className="text-sm text-muted-foreground">Digital Tracking</li>
              <li className="text-sm text-muted-foreground">Why We're Kunnathur's Best</li>
              <li className="text-sm text-muted-foreground">Contact</li>
            </ul>
          </div>

          {/* Our Mission */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Our Mission</h4>
            <p className="text-sm text-muted-foreground">
              To be the #1 digital gym in Kunnathur, providing innovative AI fitness solutions that deliver real results.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/50 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Real Fitness - Kunnathur's Best AI-Powered Digital Gym. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;