import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import UserProfileModal from "@/components/user-profile-modal";

interface LeaderboardUser {
  rank: number;
  id: number;
  username: string;
  country?: string;
  avatar?: string;
  score: number;
  stats: {
    solves: number;
  };
}

interface CountryLeaderboard {
  country: string;
  totalScore: number;
  userCount: number;
}

export default function Scoreboard() {
  const [viewMode, setViewMode] = useState<"top10" | "last24h" | "country">("top10");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard", { limit: viewMode === "top10" ? 10 : 50 }],
    enabled: viewMode !== "country",
  });

  const { data: countryLeaderboard = [], isLoading: countryLoading } = useQuery<CountryLeaderboard[]>({
    queryKey: ["/api/leaderboard/country"],
    enabled: viewMode === "country",
  });

  // Chart.js implementation
  useEffect(() => {
    if (!chartRef.current || typeof window === "undefined") return;

    const Chart = (window as any).Chart;
    if (!Chart) {
      console.warn("Chart.js not loaded");
      return;
    }

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    let chartData;
    let chartLabels;

    if (viewMode === "country") {
      chartLabels = countryLeaderboard.slice(0, 10).map(c => c.country);
      chartData = countryLeaderboard.slice(0, 10).map(c => c.totalScore);
    } else {
      chartLabels = leaderboard.slice(0, 10).map(u => u.username);
      chartData = leaderboard.slice(0, 10).map(u => u.score);
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Score",
          data: chartData,
          backgroundColor: [
            "rgba(0, 255, 136, 0.8)",
            "rgba(0, 212, 255, 0.8)",
            "rgba(255, 0, 128, 0.8)",
            "rgba(255, 255, 0, 0.8)",
            "rgba(0, 255, 136, 0.6)",
            "rgba(0, 212, 255, 0.6)",
            "rgba(255, 0, 128, 0.6)",
            "rgba(255, 255, 0, 0.6)",
            "rgba(0, 255, 136, 0.4)",
            "rgba(0, 212, 255, 0.4)",
          ],
          borderColor: [
            "#00ff88",
            "#00d4ff",
            "#ff0080",
            "#ffff00",
            "#00ff88",
            "#00d4ff",
            "#ff0080",
            "#ffff00",
            "#00ff88",
            "#00d4ff",
          ],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 255, 136, 0.1)"
            },
            ticks: {
              color: "#e0e0e0"
            }
          },
          x: {
            grid: {
              color: "rgba(0, 255, 136, 0.1)"
            },
            ticks: {
              color: "#e0e0e0",
              maxRotation: 45,
            }
          }
        },
        animation: {
          duration: 2000,
          easing: "easeOutBounce"
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [leaderboard, countryLeaderboard, viewMode]);

  const isLoading = leaderboardLoading || countryLoading;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            <span className="neon-pink">Global</span> <span className="neon-green">Scoreboard</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track the top performers and see where you stand in the global rankings
          </p>
        </div>

        {/* View Controls */}
        <div className="flex justify-center mb-8">
          <div className="glass p-1 rounded-lg">
            <Button
              variant={viewMode === "top10" ? "default" : "ghost"}
              onClick={() => setViewMode("top10")}
              className={`px-4 py-2 rounded transition-all duration-300 ${
                viewMode === "top10" 
                  ? "bg-neon-green text-dark-bg font-semibold" 
                  : "hover:bg-dark-elevated"
              }`}
            >
              <i className="fas fa-trophy mr-2"></i>Top 10
            </Button>
            <Button
              variant={viewMode === "last24h" ? "default" : "ghost"}
              onClick={() => setViewMode("last24h")}
              className={`px-4 py-2 rounded transition-all duration-300 ${
                viewMode === "last24h"
                  ? "bg-neon-cyan text-dark-bg font-semibold"
                  : "hover:bg-dark-elevated"
              }`}
            >
              <i className="fas fa-clock mr-2"></i>Last 24h
            </Button>
            <Button
              variant={viewMode === "country" ? "default" : "ghost"}
              onClick={() => setViewMode("country")}
              className={`px-4 py-2 rounded transition-all duration-300 ${
                viewMode === "country"
                  ? "bg-neon-pink text-dark-bg font-semibold"
                  : "hover:bg-dark-elevated"
              }`}
            >
              <i className="fas fa-globe mr-2"></i>By Country
            </Button>
          </div>
        </div>

        {/* Chart */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="neon-cyan font-orbitron text-center">
              {viewMode === "country" ? "Country Rankings" : "Top Performers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <canvas ref={chartRef} className="w-full h-full"></canvas>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Table */}
        <Card className="glass">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded"></div>
                ))}
              </div>
            ) : viewMode === "country" ? (
              <div className="space-y-4">
                {countryLeaderboard.map((country, index) => (
                  <div
                    key={country.country}
                    className="flex items-center justify-between p-4 rounded-lg bg-dark-elevated hover:bg-dark-bg transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-neon-green text-dark-bg" :
                        index === 1 ? "bg-neon-cyan text-dark-bg" :
                        index === 2 ? "bg-neon-pink text-dark-bg" :
                        "bg-gray-600 text-white"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold neon-cyan text-lg">
                          {country.country}
                        </div>
                        <div className="text-sm text-gray-400">
                          {country.userCount} users
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold electric-yellow text-xl">
                        {country.totalScore.toLocaleString()} pts
                      </div>
                      <div className="text-sm text-gray-400">
                        Avg: {Math.round(country.totalScore / country.userCount)} pts/user
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-dark-elevated hover:bg-dark-bg transition-colors duration-300 cursor-pointer group"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        user.rank === 1 ? "bg-neon-green text-dark-bg animate-glow" :
                        user.rank === 2 ? "bg-neon-cyan text-dark-bg" :
                        user.rank === 3 ? "bg-neon-pink text-dark-bg" :
                        "bg-gray-600 text-white"
                      }`}>
                        {user.rank}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-neon-green text-dark-bg">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold neon-cyan group-hover:neon-green transition-colors duration-300">
                          {user.username}
                          {user.rank === 1 && (
                            <Badge className="ml-2 bg-yellow-500 text-dark-bg">
                              <i className="fas fa-crown mr-1"></i>Champion
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.country && `${user.country} • `}
                          <span>{user.stats.solves} solves</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold electric-yellow text-xl">
                        {user.score.toLocaleString()} pts
                      </div>
                      <div className="text-sm text-gray-400 group-hover:neon-cyan transition-colors duration-300">
                        Click to view profile
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && leaderboard.length === 0 && viewMode !== "country" && (
              <div className="text-center py-12">
                <i className="fas fa-trophy text-4xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No rankings yet</h3>
                <p className="text-gray-500">Complete challenges to appear on the leaderboard!</p>
              </div>
            )}

            {!isLoading && countryLeaderboard.length === 0 && viewMode === "country" && (
              <div className="text-center py-12">
                <i className="fas fa-globe text-4xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No country data</h3>
                <p className="text-gray-500">Country rankings will appear as users solve challenges.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Profile Modal */}
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    </div>
  );
}
