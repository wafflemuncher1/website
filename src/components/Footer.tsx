import { Instagram, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-lg font-bold tracking-wider">
              GLOSS<span className="text-primary">WORKS</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-body">Mobile Detailing — Louisville, KY</p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:hello@glossworks.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Louisville, KY
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-body">
          © {new Date().getFullYear()} Glossworks Mobile Detailing. All rights reserved .
        </p>
      </div>
    </footer>
  );
};

export default Footer;
