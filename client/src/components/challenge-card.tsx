import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  solves: number;
  author: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  isSolved?: boolean;
}

const categoryColors: Record<string, string> = {
  Web: "bg-neon-green text-dark-bg",
  Crypto: "bg-neon-cyan text-dark-bg", 
  Pwn: "bg-neon-pink text-dark-bg",
  Forensics: "bg-electric-yellow text-dark-bg",
  Misc: "bg-orange-500 text-dark-bg",
};

const difficultyColors: Record<string, string> = {
  Easy: "text-green-400",
  Medium: "text-yellow-400", 
  Hard: "text-red-400",
  Expert: "text-purple-400",
};

export default function ChallengeCard({ challenge, onSelect, isSolved = false }: ChallengeCardProps) {
  const categoryColor = categoryColors[challenge.category] || "bg-gray-500 text-white";
  const difficultyColor = difficultyColors[challenge.difficulty] || "text-gray-400";

  return (
    <Card 
      className={`glass hover:shadow-neon transition-all duration-300 group cursor-pointer ${
        isSolved ? "border-green-500" : ""
      }`}
      onClick={() => onSelect(challenge)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge className={categoryColor}>
            {challenge.category}
          </Badge>
          <div className="flex items-center electric-yellow">
            <i className="fas fa-star mr-1"></i>
            <span>{challenge.points}</span>
          </div>
        </div>
        
        <h3 className="font-orbitron text-xl font-bold mb-2 group-hover:neon-cyan transition-colors duration-300">
          {challenge.title}
          {isSolved && <i className="fas fa-check-circle text-green-500 ml-2"></i>}
        </h3>
        
        <p className="text-gray-400 mb-4 line-clamp-2">
          {challenge.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            <i className="fas fa-users mr-1"></i>
            {challenge.solves} solves
          </span>
          <span className={difficultyColor}>
            {challenge.difficulty}
          </span>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          by {challenge.author}
        </div>
        
        <Button 
          className="w-full mt-4 glass border-neon-green hover:shadow-neon"
          variant="outline"
        >
          <i className="fas fa-play mr-2"></i>
          {isSolved ? "View Challenge" : "Start Challenge"}
        </Button>
      </CardContent>
    </Card>
  );
}
