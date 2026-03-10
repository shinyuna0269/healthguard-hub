import { useAuth, ROLE_LABELS, type UserRole } from "@/contexts/AuthContext";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TopBar = () => {
  const { currentRole, userName } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="text-sm font-extrabold font-heading text-foreground hidden md:block tracking-wide uppercase">
          Health & Sanitation Management
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {searchOpen ? (
          <Input
            placeholder="Search..."
            className="w-48 h-8 text-sm"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDark}>
          {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </Button>

        <Badge variant="outline" className="text-xs border-primary/30 text-primary hidden lg:inline-flex">
          {userName || ROLE_LABELS[currentRole]}
        </Badge>
        <Badge variant="secondary" className="text-[10px] hidden lg:inline-flex">
          {ROLE_LABELS[currentRole]}
        </Badge>
      </div>
    </header>
  );
};

export default TopBar;
