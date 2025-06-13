import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Challenge {
  id: number;
  title: string;
  category: string;
  points: number;
  flagFormat: string;
}

interface FlagSubmissionModalProps {
  challenge: Challenge | null;
  onClose: () => void;
}

export default function FlagSubmissionModal({ challenge, onClose }: FlagSubmissionModalProps) {
  const [flag, setFlag] = useState("");
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFlag = useMutation({
    mutationFn: async (submittedFlag: string) => {
      const response = await apiRequest("POST", `/api/challenges/${challenge!.id}/submit`, {
        submittedFlag,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.correct) {
        toast({
          title: "🎉 Correct Flag!",
          description: `Challenge solved! You earned ${data.points} points.`,
          className: "border-green-500 bg-green-900/20",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/solves/latest"] });
        
        onClose();
      } else {
        toast({
          title: "❌ Incorrect Flag",
          description: data.message,
          variant: "destructive",
        });
      }
      setFlag("");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit flag",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || !user || !token) return;
    
    submitFlag.mutate(flag.trim());
  };

  if (!challenge) return null;

  return (
    <Dialog open={!!challenge} onOpenChange={onClose}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="neon-cyan font-orbitron">Submit Flag</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Challenge Info */}
          <div className="glass p-4 rounded">
            <h3 className="font-bold neon-green mb-2">{challenge.title}</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{challenge.category}</span>
              <span className="electric-yellow">{challenge.points} points</span>
            </div>
          </div>

          {/* Flag Format Hint */}
          <div className="text-sm text-gray-400">
            <i className="fas fa-info-circle mr-2"></i>
            Flag format: <span className="neon-cyan font-mono">{challenge.flagFormat}</span>
          </div>

          {/* Submit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="flag" className="neon-cyan">
                Flag
              </Label>
              <Input
                id="flag"
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="Enter the flag..."
                className="terminal-input mt-2"
                disabled={submitFlag.isPending}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={!flag.trim() || submitFlag.isPending}
                className="flex-1 bg-neon-green text-dark-bg hover:shadow-neon"
              >
                {submitFlag.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-flag mr-2"></i>
                    Submit Flag
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="glass border-gray-500"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Warning about rate limiting */}
          <div className="text-xs text-gray-500 text-center">
            <i className="fas fa-clock mr-1"></i>
            Wrong submissions will trigger progressive rate limiting
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
