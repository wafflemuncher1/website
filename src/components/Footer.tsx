import { Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Our Services */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase mb-4">Our Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li>Ceramic Coatings</li>
              <li>Paint Correction & Polishing</li>
              <li>Window Tinting</li>
              <li>Paint Protection Film</li>
              <li>Matte Finish Paint Protection Film</li>
              <li>Exterior Detailing</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><a href="#" className="hover:text-foreground transition-colors">Home</a></li>
              <li><a href="#estimate" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#reviews" className="hover:text-foreground transition-colors">Reviews</a></li>
            </ul>
            <h4 className="text-sm font-bold tracking-wider uppercase mt-6 mb-3">Social Media</h4>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase mb-4">Service Areas</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li>Riverview, FL</li>
              <li>Sarasota, FL</li>
              <li>Clearwater, FL</li>
              <li>St. Petersburg, FL</li>
              <li>Shepherdsville, KY</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase mb-4">Our Location</h4>
            <div className="text-sm text-muted-foreground font-body space-y-1">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Lousville Kentucky<br />
                  United States
                </span>
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-body">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:5026120430" className="hover:text-foreground transition-colors">(502) 612-0430</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:Conatct@glossworksky.com" className="hover:text-foreground transition-colors">Contact@glossworksky.com</a>
              </li>
            </ul>
            <div className="mt-6">
              <img src={logo} alt="Glossworks" className="h-16 w-auto object-contain" />
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6">
          <p className="text-center text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Glossworks Mobile Detailing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
