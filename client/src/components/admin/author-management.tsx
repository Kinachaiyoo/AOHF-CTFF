import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AuthorFormData = z.infer<typeof authorSchema>;

interface Author {
  id: number;
  name: string;
  challengeCount?: number;
  createdAt: string;
}

function AuthorForm({ author, onClose }: { author?: Author; onClose: () => void }) {
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: author ? {
      name: author.name,
    } : {}
  });

  const createAuthor = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      return apiRequest("POST", "/api/admin/authors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author created successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create author", description: error.message, variant: "destructive" });
    }
  });

  const updateAuthor = useMutation({
    mutationFn: async (data: AuthorFormData) => {
      return apiRequest("PUT", `/api/admin/authors/${author!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author updated successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update author", description: error.message, variant: "destructive" });
    }
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
      const response = await fetch("/api/admin/authors", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch authors");
      return response.json();
    }
  });

  const deleteAuthor = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/authors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/authors"] });
      toast({ title: "Author deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete author", description: error.message, variant: "destructive" });
    }
  });

  const handleEdit = (author: Author) => {
    setSelectedAuthor(author);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedAuthor(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAuthor(undefined);
  };

  if (isLoading) {
    return (
      <Card className="glass border-neon-cyan/20">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading authors...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-orbitron text-neon-cyan">Author Management</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-neon-cyan text-dark-bg hover:shadow-cyan-glow">
              Add Author
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-neon-cyan/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan">
                {selectedAuthor ? "Edit Author" : "Create New Author"}
              </DialogTitle>
              <DialogDescription>
                {selectedAuthor ? "Update author information" : "Add a new challenge author"}
              </DialogDescription>
            </DialogHeader>
            <AuthorForm author={selectedAuthor} onClose={handleCloseForm} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-neon-cyan/20">
        <CardHeader>
          <CardTitle className="text-neon-cyan">Authors ({authors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {authors.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No authors found. Create your first author to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neon-cyan/20 hover:bg-neon-cyan/5">
                  <TableHead className="text-cyan-300">Name</TableHead>
                  <TableHead className="text-cyan-300">Challenges</TableHead>
                  <TableHead className="text-cyan-300">Created</TableHead>
                  <TableHead className="text-cyan-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author) => (
                  <TableRow key={author.id} className="border-neon-cyan/20 hover:bg-neon-cyan/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                          <span className="text-neon-cyan font-bold">
                            {author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{author.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-neon-cyan/30 text-cyan-300">
                        {author.challengeCount || 0} challenges
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(author.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(author)}
                          className="border-neon-cyan/30 text-cyan-300 hover:bg-neon-cyan/10"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAuthor.mutate(author.id)}
                          disabled={deleteAuthor.isPending}
                          className="border-red-400/30 text-red-400 hover:bg-red-400/10"
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