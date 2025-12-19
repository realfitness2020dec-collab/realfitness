import { Dumbbell, MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/50 bg-card">
      {/* Background Gradient */}
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
                <p className="text-xs tracking-wider text-primary">BLACK SQUAD</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform your body and mind with our world-class fitness facilities and expert trainers.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                123 Fitness Street, City
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                info@realfitness.com
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Working Hours</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Mon - Fri: 5:00 AM - 11:00 PM
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Saturday: 6:00 AM - 10:00 PM
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Sunday: 7:00 AM - 8:00 PM
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-lg font-bold text-foreground">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Membership Plans
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Trainers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/50 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Real Fitness - Black Squad. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
