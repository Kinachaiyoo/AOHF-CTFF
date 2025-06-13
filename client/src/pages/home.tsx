import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Target, Activity } from "lucide-react";

interface Stats {
  totalChallenges: number;
  activeUsers: number; 
  totalSolves: number;
  onlineNow: number;
}

export default function Home() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: () => ({
      totalChallenges: 25,
      activeUsers: 150,
      totalSolves: 480,
      onlineNow: 12
    })
  });

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            CyberCTF
          </h1>
          <p className="text-xl text-green-300 mb-8">
            Elite Capture The Flag Competition Platform
          </p>
          <div className="text-sm text-green-500">
            <span className="animate-pulse">█</span> Welcome to the matrix
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Total Challenges
              </CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.totalChallenges || 0}
              </div>
              <p className="text-xs text-green-600">
                Across 5 categories
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.activeUsers || 0}
              </div>
              <p className="text-xs text-green-600">
                Registered hackers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Total Solves
              </CardTitle>
              <Trophy className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.totalSolves || 0}
              </div>
              <p className="text-xs text-green-600">
                Flags captured
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Online Now
              </CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.onlineNow || 0}
              </div>
              <p className="text-xs text-green-600">
                <span className="animate-pulse">●</span> Live hackers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader>
              <CardTitle className="text-green-400">Challenge Categories</CardTitle>
              <CardDescription className="text-green-600">
                Explore different attack vectors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-green-300">Web Exploitation</span>
                <Badge variant="secondary" className="bg-red-900 text-red-300">8 challenges</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300">Cryptography</span>
                <Badge variant="secondary" className="bg-blue-900 text-blue-300">6 challenges</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300">Binary Exploitation</span>
                <Badge variant="secondary" className="bg-purple-900 text-purple-300">5 challenges</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300">Forensics</span>
                <Badge variant="secondary" className="bg-orange-900 text-orange-300">4 challenges</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300">Miscellaneous</span>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">2 challenges</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-green-500 border-opacity-30">
            <CardHeader>
              <CardTitle className="text-green-400">Getting Started</CardTitle>
              <CardDescription className="text-green-600">
                Begin your hacking journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">1. Register Account</h4>
                <p className="text-sm text-green-600">Create your hacker profile to track progress</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">2. Choose Category</h4>
                <p className="text-sm text-green-600">Start with Web or Crypto for beginners</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">3. Capture Flags</h4>
                <p className="text-sm text-green-600">Submit flags in format: flag{'{example}'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">4. Climb Leaderboard</h4>
                <p className="text-sm text-green-600">Compete with hackers worldwide</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block p-4 border border-green-500 border-opacity-30 rounded-lg bg-gray-900">
            <p className="text-green-400 mb-2">
              <span className="animate-pulse">▶</span> System Status: ONLINE
            </p>
            <p className="text-xs text-green-600">
              All systems operational • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}