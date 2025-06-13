import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface UserProfileModalProps {
  userId: number | null;
  onClose: () => void;
}

interface UserProfile {
  id: number;
  username: string;
  country?: string;
  bio?: string;
  avatar?: string;
  score: number;
  stats: {
    solves: number;
    rank: number;
  };
  solves: Array<{
    id: number;
    solvedAt: string;
    isFirstBlood: boolean;
    challenge: {
      id: number;
      title: string;
      category: string;
      points: number;
      difficulty: string;
    };
  }>;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  if (!userId) return null;

  const categoryColors: Record<string, string> = {
    Web: "bg-neon-green text-dark-bg",
    Crypto: "bg-neon-cyan text-dark-bg",
    Pwn: "bg-neon-pink text-dark-bg", 
    Forensics: "bg-electric-yellow text-dark-bg",
    Misc: "bg-orange-500 text-dark-bg",
  };

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="neon-cyan font-orbitron">User Profile</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="skeleton h-20 w-full rounded"></div>
            <div className="skeleton h-40 w-full rounded"></div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-neon-green text-dark-bg text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold neon-green">{user.username}</h2>
                {user.country && (
                  <p className="text-gray-400">
                    <i className="fas fa-flag mr-2"></i>
                    {user.country}
                  </p>
                )}
                {user.bio && (
                  <p className="text-gray-300 mt-2">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass p-4 rounded text-center">
                <div className="text-2xl font-bold electric-yellow">{user.score}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
              <div className="glass p-4 rounded text-center">
                <div className="text-2xl font-bold neon-cyan">{user.stats.solves}</div>
                <div className="text-sm text-gray-400">Challenges Solved</div>
              </div>
              <div className="glass p-4 rounded text-center">
                <div className="text-2xl font-bold neon-pink">#{user.stats.rank}</div>
                <div className="text-sm text-gray-400">Global Rank</div>
              </div>
            </div>

            {/* Solved Challenges */}
            <div>
              <h3 className="text-xl font-semibold neon-cyan mb-4">
                Solved Challenges ({user.solves.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {user.solves.length > 0 ? (
                  user.solves.map((solve) => (
                    <div
                      key={solve.id}
                      className="glass p-3 rounded flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge className={categoryColors[solve.challenge.category] || "bg-gray-500 text-white"}>
                          {solve.challenge.category}
                        </Badge>
                        <div>
                          <div className="font-semibold neon-green">
                            {solve.challenge.title}
                            {solve.isFirstBlood && (
                              <span className="ml-2 text-red-500">🩸 First Blood</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {solve.challenge.points} points • {solve.challenge.difficulty}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(solve.solvedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No challenges solved yet
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">User not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
