import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dice5, CalendarDays, Gamepad2, UserCircle, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/games", label: "Games", icon: Gamepad2 },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl rotate-12 group-hover:rotate-45 transition-transform duration-300 inline-block">🎲</span>
            </div>
            <span className="font-display text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Moscow Games Club
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors font-medium
                  ${location === link.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-border">
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <UserCircle className="h-5 w-5 text-secondary" />
                    <span className="hidden lg:inline">{user.username}</span>
                    <span className="bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full text-xs font-bold border border-accent/30">
                      {user.dice} 🎲
                    </span>
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                     <Button variant="outline" size="sm" className="text-xs">Admin</Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => logout.mutate()}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">Join Club</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-foreground p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                  <div className={`flex items-center space-x-3 p-3 rounded-lg ${location === link.href ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                    <link.icon className="h-5 w-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              ))}
              
              <div className="h-px bg-border my-2" />

              {user ? (
                <>
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg text-foreground">
                      <UserCircle className="h-5 w-5" />
                      <span>My Profile ({user.dice} 🎲)</span>
                    </div>
                  </Link>
                   {user.role === 'admin' && (
                     <Link href="/admin" onClick={() => setIsOpen(false)}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg text-foreground">
                           <span>Admin Dashboard</span>
                        </div>
                     </Link>
                   )}
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2"
                    onClick={() => {
                      logout.mutate();
                      setIsOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-primary text-white">Join</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
