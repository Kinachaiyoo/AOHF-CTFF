import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const challengeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Expert"]),
  points: z.number().min(1, "Points must be at least 1"),
  flag: z.string().min(1, "Flag is required"),
  flagFormat: z.string().default("CyberCTF{...}"),
  author: z.string().min(1, "Author is required"),
  attachmentUrl: z.string().optional(),
  instanceUrl: z.string().optional(),
  hints: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ChallengeForm = z.infer<typeof challengeSchema>;

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  flag: string;
  flagFormat: string;
  author: string;
  attachmentUrl?: string;
  instanceUrl?: string;
  hints: string[];
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  country?: string;
  score: number;
  isAdmin: boolean;
  stats: {
    solves: number;
    rank: number;
  };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("challenges");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <i className="fas fa-ban text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You don't have admin privileges.</p>
            <Button asChild className="bg-neon-green text-dark-bg">
              <a href="/">
                <i className="fas fa-home mr-2"></i>
                Go Home
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/admin/challenges"],
    queryFn: async () => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/admin/challenges", {
        headers: Object.keys(headers).length > 0 ? {
          ...headers,
          "Content-Type": "application/json",
        } : {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch challenges");
      return response.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ChallengeForm>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "Easy",
      points: 100,
      flag: "",
      flagFormat: "CyberCTF{...}",
      author: "",
      attachmentUrl: "",
      instanceUrl: "",
      hints: [],
      isActive: true,
    },
  });

  const createChallenge = useMutation({
    mutationFn: async (data: ChallengeForm) => {
      const response = await apiRequest("POST", "/api/admin/challenges", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Challenge Created",
        description: "New challenge has been successfully created.",
        className: "border-green-500 bg-green-900/20",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    },
  });

  const updateChallenge = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChallengeForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/challenges/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Challenge Updated",
        description: "Challenge has been successfully updated.",
        className: "border-green-500 bg-green-900/20",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsEditModalOpen(false);
      setSelectedChallenge(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update challenge",
        variant: "destructive",
      });
    },
  });

  const deleteChallenge = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/challenges/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Challenge Deleted",
        description: "Challenge has been successfully deleted.",
        className: "border-green-500 bg-green-900/20",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete challenge",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: ChallengeForm) => {
    createChallenge.mutate(data);
  };

  const onEditSubmit = (data: ChallengeForm) => {
    if (selectedChallenge) {
      updateChallenge.mutate({ id: selectedChallenge.id, data });
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    form.reset({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty as "Easy" | "Medium" | "Hard" | "Expert",
      points: challenge.points,
      flag: challenge.flag,
      flagFormat: challenge.flagFormat,
      author: challenge.author,
      attachmentUrl: challenge.attachmentUrl || "",
      instanceUrl: challenge.instanceUrl || "",
      hints: challenge.hints,
      isActive: challenge.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this challenge?")) {
      deleteChallenge.mutate(id);
    }
  };

  const difficultyColors = {
    Easy: "bg-green-500 text-white",
    Medium: "bg-yellow-500 text-dark-bg",
    Hard: "bg-red-500 text-white",
    Expert: "bg-purple-500 text-white",
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Admin Header */}
      <div className="glass border-b border-red-500 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="font-orbitron text-2xl font-bold text-red-500">
              <i className="fas fa-shield-alt mr-2"></i>ADMIN PANEL
            </div>
            <Badge className="bg-red-600 text-white">RESTRICTED</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Welcome, {user.username}</span>
            <Button variant="outline" className="glass border-red-500 text-red-400" onClick={logout}>
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="glass p-1">
            <TabsTrigger value="challenges" className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg">
              <i className="fas fa-flag mr-2"></i>Challenges
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan data-[state=active]:text-dark-bg">
              <i className="fas fa-users mr-2"></i>Users
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-neon-pink data-[state=active]:text-dark-bg">
              <i className="fas fa-chart-bar mr-2"></i>Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            {/* Challenges Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-orbitron text-2xl font-bold neon-green">Challenge Management</h2>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-neon-green text-dark-bg hover:shadow-neon">
                    <i className="fas fa-plus mr-2"></i>Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="neon-green font-orbitron">Create New Challenge</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Title</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="author"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Author</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="neon-cyan">Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="terminal-input" rows={3} />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Category</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="terminal-input">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="glass">
                                    {(categories as any[]).map((cat: any) => (
                                      <SelectItem key={cat.id} value={cat.name}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Difficulty</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="terminal-input">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="glass">
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                    <SelectItem value="Expert">Expert</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Points</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="terminal-input"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="flag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Flag</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="flagFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Flag Format</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="attachmentUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Attachment URL (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="instanceUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="neon-cyan">Instance URL (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} className="terminal-input" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          type="submit"
                          disabled={createChallenge.isPending}
                          className="bg-neon-green text-dark-bg hover:shadow-neon"
                        >
                          {createChallenge.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Creating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>
                              Create Challenge
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateModalOpen(false)}
                          className="glass border-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Challenges Table */}
            <Card className="glass">
              <CardContent className="p-0">
                {challengesLoading ? (
                  <div className="p-8">
                    <div className="skeleton h-64 w-full rounded"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="neon-cyan">Title</TableHead>
                        <TableHead className="neon-cyan">Category</TableHead>
                        <TableHead className="neon-cyan">Difficulty</TableHead>
                        <TableHead className="neon-cyan">Points</TableHead>
                        <TableHead className="neon-cyan">Status</TableHead>
                        <TableHead className="neon-cyan">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challenges.map((challenge) => (
                        <TableRow key={challenge.id} className="border-gray-700">
                          <TableCell className="font-medium">{challenge.title}</TableCell>
                          <TableCell>
                            <Badge className="bg-neon-green text-dark-bg">
                              {challenge.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                              {challenge.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell className="electric-yellow">{challenge.points}</TableCell>
                          <TableCell>
                            <Badge className={challenge.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                              {challenge.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(challenge)}
                                className="glass border-neon-cyan text-neon-cyan"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(challenge.id)}
                                className="glass border-red-500 text-red-500"
                              >
                                <i className="fas fa-trash"></i>
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
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="font-orbitron text-2xl font-bold neon-cyan">User Management</h2>
            
            <Card className="glass">
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-8">
                    <div className="skeleton h-64 w-full rounded"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="neon-cyan">Username</TableHead>
                        <TableHead className="neon-cyan">Email</TableHead>
                        <TableHead className="neon-cyan">Country</TableHead>
                        <TableHead className="neon-cyan">Score</TableHead>
                        <TableHead className="neon-cyan">Solves</TableHead>
                        <TableHead className="neon-cyan">Rank</TableHead>
                        <TableHead className="neon-cyan">Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-gray-700">
                          <TableCell className="font-medium neon-green">{user.username}</TableCell>
                          <TableCell className="text-gray-400">{user.email}</TableCell>
                          <TableCell>{user.country || "N/A"}</TableCell>
                          <TableCell className="electric-yellow">{user.score.toLocaleString()}</TableCell>
                          <TableCell className="neon-cyan">{user.stats.solves}</TableCell>
                          <TableCell className="neon-pink">#{user.stats.rank}</TableCell>
                          <TableCell>
                            <Badge className={user.isAdmin ? "bg-red-500 text-white" : "bg-gray-500 text-white"}>
                              {user.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <h2 className="font-orbitron text-2xl font-bold neon-pink">Platform Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold neon-green mb-2">
                    {challenges.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Challenges</div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold neon-cyan mb-2">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-400">Registered Users</div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold electric-yellow mb-2">
                    {challenges.filter(c => c.isActive).length}
                  </div>
                  <div className="text-sm text-gray-400">Active Challenges</div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold neon-pink mb-2">
                    {users.filter(u => u.isAdmin).length}
                  </div>
                  <div className="text-sm text-gray-400">Admin Users</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Category Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="neon-cyan">Challenge Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(categories as any[]).map((category: any) => {
                    const count = challenges.filter(c => c.category === category.name).length;
                    const percentage = challenges.length > 0 ? Math.round((count / challenges.length) * 100) : 0;
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className={`${category.icon} neon-green`}></i>
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-dark-elevated rounded-full h-2">
                            <div
                              className="bg-neon-green h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400 w-16 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Challenge Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="neon-cyan font-orbitron">Edit Challenge</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                {/* Same form fields as create modal - shortened for brevity */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="neon-cyan">Title</FormLabel>
                        <FormControl>
                          <Input {...field} className="terminal-input" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="neon-cyan">Author</FormLabel>
                        <FormControl>
                          <Input {...field} className="terminal-input" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={updateChallenge.isPending}
                    className="bg-neon-cyan text-dark-bg hover:shadow-cyan-glow"
                  >
                    {updateChallenge.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Update Challenge
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="glass border-gray-500"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
