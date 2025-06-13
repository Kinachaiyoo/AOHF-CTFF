import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  country?: string;
  bio?: string;
  avatar?: string;
  score: number;
  isAdmin: boolean;
  solveStreak: number;
  createdAt: string;
  lastLogin?: string;
  solves: Array<{
    id: number;
    challengeId: number;
    solvedAt: string;
    challenge: {
      id: number;
      title: string;
      category: string;
      points: number;
    };
  }>;
}

interface Challenge {
  id: number;
  title: string;
  category: string;
  points: number;
}

function UserSolvesModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);

  const { data: challenges = [] } = useQuery({
    queryKey: ["/api/admin/challenges"],
    queryFn: async () => {
      const response = await fetch("/api/admin/challenges", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch challenges");
      return response.json();
    },
  });

  const addSolve = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await fetch(`/api/admin/users/${user.id}/solves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ challengeId }),
      });
      if (!response.ok) throw new Error("Failed to add solve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Solve added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add solve", variant: "destructive" });
    },
  });

  const removeSolve = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await fetch(`/api/admin/users/${user.id}/solves/${challengeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to remove solve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Solve removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove solve", variant: "destructive" });
    },
  });

  const userSolvedChallengeIds = new Set(user.solves.map(solve => solve.challengeId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neon-cyan">Manage Solves for {user.username}</h3>
          <p className="text-gray-400">Current score: {user.score} points</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Add New Solve</Label>
          <div className="flex gap-2">
            <Select onValueChange={(value) => setSelectedChallenge(parseInt(value))}>
              <SelectTrigger className="glass border-neon-cyan/30">
                <SelectValue placeholder="Select challenge" />
              </SelectTrigger>
              <SelectContent>
                {challenges
                  .filter((challenge: Challenge) => !userSolvedChallengeIds.has(challenge.id))
                  .map((challenge: Challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id.toString()}>
                      {challenge.title} ({challenge.points} pts)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedChallenge && addSolve.mutate(selectedChallenge)}
              disabled={!selectedChallenge || addSolve.isPending}
              className="bg-neon-green text-dark-bg hover:shadow-neon"
            >
              Add Solve
            </Button>
          </div>
        </div>

        <div>
          <Label>Current Solves</Label>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {user.solves.length === 0 ? (
              <p className="text-gray-400 py-4">No solves yet</p>
            ) : (
              user.solves.map((solve) => (
                <div key={solve.id} className="flex items-center justify-between p-3 glass border border-neon-cyan/20 rounded">
                  <div>
                    <div className="font-medium">{solve.challenge.title}</div>
                    <div className="text-sm text-gray-400">
                      {solve.challenge.category} • {solve.challenge.points} pts • 
                      Solved {new Date(solve.solvedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeSolve.mutate(solve.challengeId)}
                    disabled={removeSolve.isPending}
                    className="border-red-400 text-red-400 hover:bg-red-400/20"
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const toggleAdminStatus = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isAdmin }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neon-cyan">User Management</h2>
      </div>

      <Card className="glass border-neon-cyan">
        <CardHeader>
          <CardTitle className="text-neon-cyan">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Solves</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-neon-cyan/20 text-neon-cyan">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {user.country && (
                            <div className="text-sm text-gray-400">{user.country}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-electric-yellow/20 text-electric-yellow">
                        {user.score} pts
                      </Badge>
                    </TableCell>
                    <TableCell>{user.solves.length}</TableCell>
                    <TableCell>
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={(checked) => 
                          toggleAdminStatus.mutate({ userId: user.id, isAdmin: checked })
                        }
                        disabled={toggleAdminStatus.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                          className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
                        >
                          Manage Solves
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUser.mutate(user.id)}
                          disabled={deleteUser.isPending}
                          className="border-red-400 text-red-400 hover:bg-red-400/20"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass border-neon-cyan max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-neon-cyan">Manage User Solves</DialogTitle>
            <DialogDescription>
              Add or remove challenge solves for this user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserSolvesModal
              user={selectedUser}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}