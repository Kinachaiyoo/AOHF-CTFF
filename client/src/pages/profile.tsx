import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfile {
  id: number;
  username: string;
  email: string;
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

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: profile?.bio || "",
      avatar: profile?.avatar || "",
    },
  });

  // Reset form when profile data changes
  useState(() => {
    if (profile) {
      form.reset({
        bio: profile.bio || "",
        avatar: profile.avatar || "",
      });
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PUT", "/api/me", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        className: "border-green-500 bg-green-900/20",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data);
  };

  if (!user) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <i className="fas fa-lock text-4xl text-gray-500 mb-4"></i>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Authentication Required</h2>
            <p className="text-gray-500 mb-4">Please log in to view your profile.</p>
            <Button asChild className="bg-neon-green text-dark-bg">
              <a href="/login">
                <i className="fas fa-sign-in-alt mr-2"></i>
                Login
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="space-y-8">
            <div className="skeleton h-32 w-full rounded"></div>
            <div className="skeleton h-48 w-full rounded"></div>
            <div className="skeleton h-64 w-full rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Profile Not Found</h2>
            <p className="text-gray-500">Unable to load your profile data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Web: "bg-neon-green text-dark-bg",
    Crypto: "bg-neon-cyan text-dark-bg",
    Pwn: "bg-neon-pink text-dark-bg",
    Forensics: "bg-electric-yellow text-dark-bg",
    Misc: "bg-orange-500 text-dark-bg",
  };

  const categorySolves = profile.solves.reduce((acc, solve) => {
    const category = solve.challenge.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold mb-4">
            <span className="neon-green">User</span> <span className="neon-cyan">Profile</span>
          </h1>
        </div>

        {/* Profile Header */}
        <Card className="glass mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-neon-green text-dark-bg text-3xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-orbitron text-3xl font-bold neon-green mb-2">
                  {profile.username}
                </h2>
                {profile.country && (
                  <p className="text-gray-400 mb-4">
                    <i className="fas fa-flag mr-2"></i>
                    {profile.country}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Badge className="bg-electric-yellow text-dark-bg">
                    <i className="fas fa-star mr-1"></i>
                    {profile.score.toLocaleString()} points
                  </Badge>
                  <Badge className="bg-neon-cyan text-dark-bg">
                    <i className="fas fa-flag mr-1"></i>
                    {profile.stats.solves} solves
                  </Badge>
                  <Badge className="bg-neon-pink text-dark-bg">
                    <i className="fas fa-trophy mr-1"></i>
                    Rank #{profile.stats.rank}
                  </Badge>
                </div>
              </div>
              
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="glass border-neon-green hover:shadow-neon"
                variant="outline"
              >
                <i className={`fas ${isEditing ? "fa-times" : "fa-edit"} mr-2`}></i>
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        {isEditing && (
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="neon-cyan font-orbitron">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="neon-cyan">Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/avatar.jpg"
                            className="terminal-input"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="neon-cyan">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about yourself..."
                            className="terminal-input min-h-24"
                            maxLength={500}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                        <div className="text-xs text-gray-500">
                          {form.watch("bio")?.length || 0}/500 characters
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="bg-neon-green text-dark-bg hover:shadow-neon"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="glass border-gray-500"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="neon-cyan font-orbitron">Solves by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(categorySolves).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(categorySolves).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <Badge className={categoryColors[category] || "bg-gray-500 text-white"}>
                        {category}
                      </Badge>
                      <span className="font-semibold">{count} solves</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No challenges solved yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="neon-cyan font-orbitron">Recent Solves</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.solves.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {profile.solves
                    .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
                    .slice(0, 10)
                    .map((solve) => (
                      <div key={solve.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-elevated">
                        <div className="flex items-center space-x-3">
                          <Badge className={categoryColors[solve.challenge.category] || "bg-gray-500 text-white"}>
                            {solve.challenge.category}
                          </Badge>
                          <div>
                            <div className="font-semibold neon-green">
                              {solve.challenge.title}
                              {solve.isFirstBlood && (
                                <span className="ml-2 text-red-500">🩸</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {solve.challenge.points} points
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(solve.solvedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No challenges solved yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="neon-cyan font-orbitron">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-400">Username</Label>
                <div className="font-mono text-neon-green">{profile.username}</div>
              </div>
              <div>
                <Label className="text-gray-400">Email</Label>
                <div className="font-mono text-neon-cyan">{profile.email}</div>
              </div>
              {profile.country && (
                <div>
                  <Label className="text-gray-400">Country</Label>
                  <div className="font-mono text-gray-300">{profile.country}</div>
                </div>
              )}
              <div>
                <Label className="text-gray-400">Member Since</Label>
                <div className="font-mono text-gray-300">
                  {new Date().toLocaleDateString()} {/* In real app, this would come from profile data */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
