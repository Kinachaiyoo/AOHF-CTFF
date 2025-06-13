import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChallengeCard from "@/components/challenge-card";
import FlagSubmissionModal from "@/components/flag-submission-modal";
import { useAuth } from "@/hooks/use-auth";

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  solves: number;
  author: string;
  flagFormat: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function Challenges() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("points");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: userSolves = [] } = useQuery({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const solvedChallengeIds = new Set(
    userSolves?.solves?.map((solve: any) => solve.challenge.id) || []
  );

  // Filter and sort challenges
  const filteredChallenges = challenges
    .filter((challenge) => {
      const matchesCategory = selectedCategory === "all" || challenge.category === selectedCategory;
      const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "points":
          return b.points - a.points;
        case "difficulty":
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 5) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 5);
        case "solves":
          return b.solves - a.solves;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleChallengeSelect = (challenge: Challenge) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }
    setSelectedChallenge(challenge);
  };

  if (challengesLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-8">
            <div className="skeleton h-12 w-64 mx-auto rounded"></div>
            <div className="skeleton h-20 w-full rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-64 rounded"></div>
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
            <span className="neon-cyan">Active</span> <span className="neon-green">Challenges</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Test your cybersecurity skills with our diverse collection of challenges
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <Input
                  placeholder="Search challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="terminal-input"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 glass border-neon-cyan">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="glass border-neon-cyan">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <i className={`${category.icon} mr-2`}></i>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 glass border-neon-green">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass border-neon-green">
                  <SelectItem value="points">Points (High to Low)</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="solves">Most Solved</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={`glass border-neon-green ${
              selectedCategory === "all" ? "bg-neon-green text-dark-bg" : "hover:border-neon-green hover:neon-green"
            }`}
          >
            <i className="fas fa-globe mr-2"></i>All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.name)}
              className={`glass transition-all duration-300 ${
                selectedCategory === category.name
                  ? `bg-neon-${category.color.replace('#', '')} text-dark-bg`
                  : `hover:border-neon-${category.color.replace('#', '')} hover:neon-${category.color.replace('#', '')}`
              }`}
              style={{
                borderColor: selectedCategory === category.name ? category.color : undefined,
                color: selectedCategory === category.name ? '#0a0a0a' : undefined,
                backgroundColor: selectedCategory === category.name ? category.color : undefined,
              }}
            >
              <i className={`${category.icon} mr-2`}></i>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold neon-green">{filteredChallenges.length}</div>
              <div className="text-sm text-gray-400">Available</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold neon-cyan">
                {user ? solvedChallengeIds.size : 0}
              </div>
              <div className="text-sm text-gray-400">Solved</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold electric-yellow">
                {filteredChallenges.reduce((sum, c) => sum + c.points, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Points</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold neon-pink">
                {user ? Math.round((solvedChallengeIds.size / challenges.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-400">Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges Grid */}
        {filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onSelect={handleChallengeSelect}
                isSolved={solvedChallengeIds.has(challenge.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <i className="fas fa-search text-4xl text-gray-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No challenges found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}

        {/* Flag Submission Modal */}
        <FlagSubmissionModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      </div>
    </div>
  );
}
