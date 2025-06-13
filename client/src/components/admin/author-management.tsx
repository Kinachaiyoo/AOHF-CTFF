import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AuthorFormData = z.infer<typeof authorSchema>;

interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
  website?: string;
  twitter?: string;
  github?: string;
  avatar?: string;
  challengeCount?: number;
  createdAt: string;
}

function AuthorForm({ author, onClose }: { author?: Author; onClose: () => void }) {
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: author ? {
      name: author.name,
      email: author.email,
      bio: author.bio || "",
      website: author.website || "",
      twitter: author.twitter || "",
      github: author.github || "",
      avatar: author.avatar || "",
    } : {}
  });

  const createAuthor = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      const response = await fetch("/api/admin/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create author");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create author", variant: "destructive" });
    },
  });

  const updateAuthor = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      const response = await fetch(`/api/admin/authors/${author!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update author");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update author", variant: "destructive" });
    },
  });

  const onSubmit = (data: AuthorFormData) => {
    if (author) {
      updateAuthor.mutate(data);
    } else {
      createAuthor.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Author Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter author name"
            className="glass border-neon-cyan/30"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="author@example.com"
            className="glass border-neon-cyan/30"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          placeholder="Brief description about the author"
          className="glass border-neon-cyan/30"
        />
        {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>}
      </div>

      <div>
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input
          id="avatar"
          {...register("avatar")}
          placeholder="https://example.com/avatar.jpg"
          className="glass border-neon-cyan/30"
        />
        {errors.avatar && <p className="text-red-400 text-sm mt-1">{errors.avatar.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...register("website")}
            placeholder="https://author-website.com"
            className="glass border-neon-cyan/30"
          />
          {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="twitter">Twitter Handle</Label>
          <Input
            id="twitter"
            {...register("twitter")}
            placeholder="@username"
            className="glass border-neon-cyan/30"
          />
          {errors.twitter && <p className="text-red-400 text-sm mt-1">{errors.twitter.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="github">GitHub Username</Label>
        <Input
          id="github"
          {...register("github")}
          placeholder="github-username"
          className="glass border-neon-cyan/30"
        />
        {errors.github && <p className="text-red-400 text-sm mt-1">{errors.github.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-neon-cyan text-dark-bg hover:shadow-cyan-glow"
          disabled={createAuthor.isPending || updateAuthor.isPending}
        >
          {author ? "Update Author" : "Create Author"}
        </Button>
      </div>
    </form>
  );
}

export default function AuthorManagement() {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: authors = [], isLoading } = useQuery({
    queryKey: ["/api/admin/authors"],
    queryFn: async () => {
      const response = await fetch("/api/admin/authors", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch authors");
      return response.json();
    },
  });

  const deleteAuthor = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/authors/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete author");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete author", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neon-cyan">Author Management</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon-green text-dark-bg hover:shadow-neon">
              <i className="fas fa-plus mr-2"></i>Add Author
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-neon-cyan max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan">
                {selectedAuthor ? "Edit Author" : "Create New Author"}
              </DialogTitle>
              <DialogDescription>
                {selectedAuthor ? "Update the author details below." : "Add a new challenge author to the platform."}
              </DialogDescription>
            </DialogHeader>
            <AuthorForm
              author={selectedAuthor}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedAuthor(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-neon-cyan">
        <CardHeader>
          <CardTitle className="text-neon-cyan">All Authors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading authors...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead>Challenges</TableHead>
                  <TableHead>Social</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author: Author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={author.avatar} />
                          <AvatarFallback className="bg-neon-cyan/20 text-neon-cyan">
                            {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{author.name}</div>
                          {author.website && (
                            <a 
                              href={author.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-neon-cyan hover:underline"
                            >
                              <i className="fas fa-external-link-alt mr-1"></i>
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{author.email}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {author.bio || "No bio provided"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-electric-yellow/20 text-electric-yellow">
                        {author.challengeCount || 0} challenges
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {author.twitter && (
                          <a 
                            href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <i className="fab fa-twitter"></i>
                          </a>
                        )}
                        {author.github && (
                          <a 
                            href={`https://github.com/${author.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <i className="fab fa-github"></i>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAuthor(author);
                            setIsFormOpen(true);
                          }}
                          className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAuthor.mutate(author.id)}
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
    </div>
  );
}