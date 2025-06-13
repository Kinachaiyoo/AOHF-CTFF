import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThreeLogo from "@/components/three-logo";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface Stats {
  totalChallenges: number;
  activeUsers: number; 
  totalSolves: number;
  onlineNow: number;
}

export default function Home() {
  const { user } = useAuth();
  
  // In a real app, these would come from an API
  const stats: Stats = {
    totalChallenges: 147,
    activeUsers: 2834,
    totalSolves: 12456,
    onlineNow: 487,
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg"></div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <ThreeLogo />
          </div>
          
          <h1 className="font-orbitron text-6xl md:text-8xl font-bold mb-4">
            <span className="neon-green">Cyber</span>
            <span className="neon-cyan">CTF</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Challenge yourself with the most advanced cybersecurity puzzles
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link href="/challenges">
                <Button className="gradient-border p-0.5 rounded-lg group">
                  <span className="bg-dark-bg px-8 py-3 rounded-lg block group-hover:bg-dark-surface transition-colors duration-300">
                    <i className="fas fa-play mr-2"></i>Start Challenges
                  </span>
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button className="gradient-border p-0.5 rounded-lg group">
                  <span className="bg-dark-bg px-8 py-3 rounded-lg block group-hover:bg-dark-surface transition-colors duration-300">
                    <i className="fas fa-rocket mr-2"></i>Get Started
                  </span>
                </Button>
              </Link>
            )}
            
            <Link href="/scoreboard">
              <Button variant="outline" className="glass border-neon-cyan hover:shadow-cyan-glow px-8 py-3">
                <i className="fas fa-trophy mr-2"></i>View Scoreboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-orbitron text-3xl font-bold text-center mb-12 neon-cyan">
            Platform Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="glass hover:shadow-neon transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold neon-green mb-2">
                  {stats.totalChallenges.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Challenges</div>
              </CardContent>
            </Card>
            
            <Card className="glass hover:shadow-cyan-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold neon-cyan mb-2">
                  {stats.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Active Users</div>
              </CardContent>
            </Card>
            
            <Card className="glass hover:shadow-pink-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold neon-pink mb-2">
                  {stats.totalSolves.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Solves</div>
              </CardContent>
            </Card>
            
            <Card className="glass hover:shadow-yellow-glow transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold electric-yellow mb-2">
                  {stats.onlineNow.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Online Now</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Challenges Preview */}
      <section className="py-16 px-6 bg-dark-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-orbitron text-3xl font-bold mb-4">
              <span className="neon-green">Featured</span> <span className="neon-cyan">Challenges</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Dive into our carefully crafted cybersecurity challenges spanning multiple categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { category: "Web", icon: "fas fa-code", color: "neon-green", count: 42 },
              { category: "Crypto", icon: "fas fa-lock", color: "neon-cyan", count: 38 },
              { category: "Pwn", icon: "fas fa-bug", color: "neon-pink", count: 29 },
              { category: "Forensics", icon: "fas fa-search", color: "electric-yellow", count: 38 },
            ].map((cat) => (
              <Card key={cat.category} className="glass hover:shadow-neon transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className={`text-4xl mb-4 ${cat.color} group-hover:animate-glow`}>
                    <i className={cat.icon}></i>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{cat.category}</h3>
                  <p className="text-gray-400 text-sm mb-4">{cat.count} challenges</p>
                  <div className={`w-full h-2 bg-dark-bg rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full bg-gradient-to-r from-${cat.color.replace('neon-', '').replace('electric-', '')} to-transparent`}
                      style={{ width: `${Math.random() * 60 + 40}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link href="/challenges">
              <Button className="bg-neon-green text-dark-bg hover:shadow-neon px-8 py-3">
                <i className="fas fa-flag mr-2"></i>
                View All Challenges
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-elevated py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="font-orbitron text-2xl font-bold neon-green mb-4">CyberCTF</div>
          <p className="text-gray-400 mb-4">The ultimate cybersecurity challenge platform</p>
          <div className="flex justify-center space-x-6 text-gray-500">
            <a href="#" className="hover:neon-green transition-colors duration-300">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="hover:neon-cyan transition-colors duration-300">
              <i className="fab fa-discord"></i>
            </a>
            <a href="#" className="hover:neon-pink transition-colors duration-300">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
