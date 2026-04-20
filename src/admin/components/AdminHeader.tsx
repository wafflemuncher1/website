import { Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Left: dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Navigation</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/admin/calender")}>
            Calender
          </DropdownMenuItem>

          {/* ✅ change this from "disabled coming soon" to a real link */}
          <DropdownMenuItem onClick={() => navigate("/admin/bookings")}>
            Bookings
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/admin/accounting")}>
            Accounting 
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/admin/investments")}>
            Investments
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate("/admin/servicearea")}>
            ServiceArea 
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/admin/database")}>
            Database
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: logo linking to dashboard */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
      >
        GLOSSWORKS
      </button>
    </header>
  );
};

export default AdminHeader;