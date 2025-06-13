import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UserProfileModal from "@/components/user-profile-modal";

interface User {
  id: number;
  username: string;
  country?: string;
  avatar?: string;
  score: number;
  stats: {
    solves: number;
    rank: number;
  };
}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (user.country && user.country.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "username":
          return a.username.localeCompare(b.username);
        case "solves":
          return b.stats.solves - a.stats.solves;
        case "country":
          return (a.country || "").localeCompare(b.country || "");
        default:
          return 0;
      }
    });

  // Group users by country for statistics
  const countryStats = users.reduce((acc, user) => {
    if (user.country) {
      if (!acc[user.country]) {
        acc[user.country] = { count: 0, totalScore: 0 };
      }
      acc[user.country].count++;
      acc[user.country].totalScore += user.score;
    }
    return acc;
  }, {} as Record<string, { count: number; totalScore: number }>);

  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b.totalScore - a.totalScore)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-8">
            <div className="skeleton h-12 w-64 mx-auto rounded"></div>
            <div className="skeleton h-20 w-full rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-48 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            <span className="neon-cyan">All</span> <span className="neon-green">Users</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore the community of cybersecurity enthusiasts and see their challenge progress
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="terminal-input"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 glass border-neon-green">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass border-neon-green">
                  <SelectItem value="score">Score (High to Low)</SelectItem>
                  <SelectItem value="username">Username (A-Z)</SelectItem>
                  <SelectItem value="solves">Solves (High to Low)</SelectItem>
                  <SelectItem value="country">Country (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold neon-green mb-2">
                {users.length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Users</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold neon-cyan mb-2">
                {Object.keys(countryStats).length}
              </div>
              <div className="text-sm text-gray-400">Countries</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold electric-yellow mb-2">
                {users.reduce((sum, user) => sum + user.score, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Points</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold neon-pink mb-2">
                {users.reduce((sum, user) => sum + user.stats.solves, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Solves</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Countries */}
        {topCountries.length > 0 && (
          <Card className="glass mb-8">
            <CardContent className="p-6">
              <h3 className="font-orbitron text-xl font-bold neon-cyan mb-4">
                Top Countries by Score
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topCountries.map(([country, stats], index) => (
                  <div 
                    key={country}
                    className="text-center p-4 rounded-lg bg-dark-elevated hover:bg-dark-bg transition-colors duration-300"
                  >
                    <div className={`text-2xl mb-2 ${
                      index === 0 ? "neon-green" :
                      index === 1 ? "neon-cyan" :
                      index === 2 ? "neon-pink" :
                      "electric-yellow"
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="font-semibold text-lg">{country}</div>
                    <div className="text-sm text-gray-400">{stats.count} users</div>
                    <div className="text-sm electric-yellow">
                      {stats.totalScore.toLocaleString()} pts
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="glass hover:shadow-neon transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedUserId(user.id)}
              >
                <CardContent className="p-6 text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-4">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-neon-green text-dark-bg text-xl">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-bold text-lg neon-cyan group-hover:neon-green transition-colors duration-300 mb-2">
                    {user.username}
                  </h3>
                  
                  {user.country && (
                    <div className="text-sm text-gray-400 mb-3">
                      <i className="fas fa-flag mr-1"></i>
                      {user.country}
                    </div>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Score:</span>
                      <span className="electric-yellow font-semibold">
                        {user.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Solves:</span>
                      <span className="neon-cyan font-semibold">
                        {user.stats.solves}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rank:</span>
                      <span className="neon-pink font-semibold">
                        #{user.stats.rank}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rank Badge */}
                  {user.stats.rank <= 3 && (
                    <Badge className={`mb-2 ${
                      user.stats.rank === 1 ? "bg-yellow-500 text-dark-bg" :
                      user.stats.rank === 2 ? "bg-gray-300 text-dark-bg" :
                      "bg-orange-600 text-white"
                    }`}>
                      {user.stats.rank === 1 && <i className="fas fa-crown mr-1"></i>}
                      {user.stats.rank === 2 && <i className="fas fa-medal mr-1"></i>}
                      {user.stats.rank === 3 && <i className="fas fa-award mr-1"></i>}
                      Rank #{user.stats.rank}
                    </Badge>
                  )}
                  
                  <div className="text-xs text-gray-500 group-hover:neon-cyan transition-colors duration-300">
                    Click to view profile
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <i className="fas fa-users text-4xl text-gray-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}

        {/* User Profile Modal */}
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    </div>
  );
}
