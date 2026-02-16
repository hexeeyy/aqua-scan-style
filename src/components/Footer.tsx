import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ursLogo from '@/assets/urs-logo.png';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 backdrop-blur-xl bg-card/80 shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-2">
          {/* University Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src={ursLogo} 
                  alt="University of Rizal System Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h3 className="text-[9px] font-bold text-foreground tracking-tight">University of Rizal System</h3>
                    <p className="text-[7px] text-muted-foreground">
                    College of Engineering
                    </p>
                    <p className="text-[7px] text-muted-foreground -mt-1">
                    BS Computer Engineering
                    </p>
              </div>
            </div>
              <div className="text-[7px] ml-12 text-muted-foreground">
                <p className="">
                Innovating for a sustainable
              </p>
              <p className="-mt-1">
                future through technology.
              </p>
              </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center">
            <h4 className="text-[9px] font-bold text-foreground mb-3">Connect With Us</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 rounded-lg hover:bg-primary/5"
              >
                <a href="https://github.com/yourusername/sari-one" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 rounded-lg hover:bg-primary/5"
              >
                <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 rounded-lg hover:bg-primary/5"
              >
                <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 rounded-lg hover:bg-primary/5"
              >
                <a href="mailto:contact@sari-one.ph" aria-label="Email">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[9px] font-bold text-center text-foreground mb-3">Get In Touch</h4>
            <ul className="space-y-1 text-[7px] flex flex-col items-center text-muted-foreground">
              <li className="flex items-center gap-1">
                <span className="text-primary">📍</span>
                <span>Morong, Rizal, Philippines</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-primary">📧</span>
                <span>hexilonpayno@gmail.com</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-primary">📞</span>
                <span>+63 (916) 176-3829</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[7px] text-muted-foreground">
          <p className="order-2 md:order-1">© {currentYear} SARI-ONE. All rights reserved.</p>
          <p className="order-1 md:order-2">Developed by Computer Engineering Students</p>
        </div>
      </div>
    </footer>
  );
};