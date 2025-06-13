import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Don't show navigation on login/register pages
  if (location.includes("/login") || location.includes("/register") || location.includes("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home", icon: "fas fa-home" },
    { href: "/challenges", label: "Challenges", icon: "fas fa-flag" },
    { href: "/scoreboard", label: "Scoreboard", icon: "fas fa-trophy" },
    { href: "/rules", label: "Rules", icon: "fas fa-book" },
    { href: "/users", label: "All Users", icon: "fas fa-users" },
  ];

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="font-orbitron text-2xl font-bold neon-green animate-glow cursor-pointer">
            <i className="fas fa-shield-alt mr-2"></i>CyberCTF
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`hover:neon-green transition-colors duration-300 cursor-pointer ${
                  location === link.href ? "neon-green" : "text-gray-300"
                }`}
              >
                <i className={`${link.icon} mr-2`}></i>
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-neon-green text-dark-bg">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="neon-cyan">{user.username}</span>
                    {user.score !== undefined && (
                      <span className="electric-yellow text-sm">
                        {user.score} pts
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-neon-green">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <i className="fas fa-user mr-2"></i>Profile
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <i className="fas fa-cog mr-2"></i>Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-400">
                  <i className="fas fa-sign-out-alt mr-2"></i>Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="glass border-neon-cyan hover:shadow-cyan-glow">
                  <i className="fas fa-sign-in-alt mr-2"></i>Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-neon-green text-dark-bg hover:shadow-neon">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
