import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const THEME_STORAGE_KEY = "healthguard-theme";

const TopBar = () => {
  const navigate = useNavigate();
  const { currentRole, userName, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(THEME_STORAGE_KEY, "light");
    }
  }, [isDark]);

  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(isDarkClass);
  }, []);

  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <Link
          to="/"
          className="text-sm font-extrabold font-heading text-foreground hidden md:block tracking-wide uppercase hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
        >
          Health & Sanitation Management
        </Link>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(userName || ROLE_LABELS[currentRole])
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-medium truncate max-w-[120px]">
                  {userName || ROLE_LABELS[currentRole]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {ROLE_LABELS[currentRole]}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">
              Signed in as
              <div className="font-medium truncate">{userName || ROLE_LABELS[currentRole]}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                navigate("/login");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
