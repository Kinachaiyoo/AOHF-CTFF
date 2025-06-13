import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const challengeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["easy", "medium", "hard", "insane"]),
  points: z.number().min(1, "Points must be at least 1"),
  flag: z.string().min(1, "Flag is required"),
  flagFormat: z.string().optional(),
  hints: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
  author: z.string().min(1, "Author is required"),
  instanceUrl: z.string().url().optional().or(z.literal("")),
  writeup: z.string().optional(),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  flag: string;
  flagFormat?: string;
  hints?: string[];
  files?: string[];
  author: string;
  instanceUrl?: string;
  writeup?: string;
  solves: number;
  isActive: boolean;
  createdAt: string;
}

function ChallengeForm({ challenge, onClose }: { challenge?: Challenge; onClose: () => void }) {
  const { toast } = useToast();
  const [hints, setHints] = useState<string[]>(challenge?.hints || [""]);
  const [files, setFiles] = useState<string[]>(challenge?.files || [""]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: challenge ? {
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty as any,
      points: challenge.points,
      flag: challenge.flag,
      flagFormat: challenge.flagFormat || "",
      author: challenge.author,
      instanceUrl: challenge.instanceUrl || "",
      writeup: challenge.writeup || "",
    } : {
      difficulty: "easy",
      points: 100,
      flagFormat: "CTF{...}",
    }
  });

  const createChallenge = useMutation({
    mutationFn: async (data: ChallengeFormData) => {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          hints: hints.filter(h => h.trim()),
          files: files.filter(f => f.trim()),
        }),
      });
      if (!response.ok) throw new Error("Failed to create challenge");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      toast({ title: "Challenge created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create challenge", variant: "destructive" });
    },
  });

  const updateChallenge = useMutation({
    mutationFn: async (data: ChallengeFormData) => {
      const response = await fetch(`/api/admin/challenges/${challenge!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          hints: hints.filter(h => h.trim()),
          files: files.filter(f => f.trim()),
        }),
      });
      if (!response.ok) throw new Error("Failed to update challenge");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      toast({ title: "Challenge updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update challenge", variant: "destructive" });
    },
  });

  const onSubmit = (data: ChallengeFormData) => {
    if (challenge) {
      updateChallenge.mutate(data);
    } else {
      createChallenge.mutate(data);
    }
  };

  const addHint = () => setHints([...hints, ""]);
  const removeHint = (index: number) => setHints(hints.filter((_, i) => i !== index));
  const updateHint = (index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    setHints(newHints);
  };

  const addFile = () => setFiles([...files, ""]);
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));
  const updateFile = (index: number, value: string) => {
    const newFiles = [...files];
    newFiles[index] = value;
    setFiles(newFiles);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Challenge Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Enter challenge title"
            className="glass border-neon-cyan/30"
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            {...register("author")}
            placeholder="Challenge author"
            className="glass border-neon-cyan/30"
          />
          {errors.author && <p className="text-red-400 text-sm mt-1">{errors.author.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Challenge description"
          className="glass border-neon-cyan/30 min-h-[100px]"
        />
        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            {...register("category")}
            placeholder="web, crypto, pwn, etc."
            className="glass border-neon-cyan/30"
          />
          {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select onValueChange={(value) => setValue("difficulty", value as any)}>
            <SelectTrigger className="glass border-neon-cyan/30">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="insane">Insane</SelectItem>
            </SelectContent>
          </Select>
          {errors.difficulty && <p className="text-red-400 text-sm mt-1">{errors.difficulty.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            {...register("points", { valueAsNumber: true })}
            placeholder="100"
            className="glass border-neon-cyan/30"
          />
          {errors.points && <p className="text-red-400 text-sm mt-1">{errors.points.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="flag">Flag</Label>
          <Input
            id="flag"
            {...register("flag")}
            placeholder="CTF{actual_flag_here}"
            className="glass border-neon-cyan/30"
          />
          {errors.flag && <p className="text-red-400 text-sm mt-1">{errors.flag.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="flagFormat">Flag Format</Label>
          <Input
            id="flagFormat"
            {...register("flagFormat")}
            placeholder="CTF{...}"
            className="glass border-neon-cyan/30"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="instanceUrl">Instance URL (Optional)</Label>
        <Input
          id="instanceUrl"
          {...register("instanceUrl")}
          placeholder="https://challenge.example.com"
          className="glass border-neon-cyan/30"
        />
      </div>

      <div>
        <Label>Hints</Label>
        <div className="space-y-2">
          {hints.map((hint, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={hint}
                onChange={(e) => updateHint(index, e.target.value)}
                placeholder={`Hint ${index + 1}`}
                className="glass border-neon-cyan/30"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeHint(index)}
                className="border-red-400 text-red-400 hover:bg-red-400/20"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHint}
            className="border-neon-green text-neon-green hover:bg-neon-green/20"
          >
            Add Hint
          </Button>
        </div>
      </div>

      <div>
        <Label>Files/Attachments</Label>
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={file}
                onChange={(e) => updateFile(index, e.target.value)}
                placeholder="File URL or name"
                className="glass border-neon-cyan/30"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFile(index)}
                className="border-red-400 text-red-400 hover:bg-red-400/20"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFile}
            className="border-neon-green text-neon-green hover:bg-neon-green/20"
          >
            Add File
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="writeup">Writeup (Optional)</Label>
        <Textarea
          id="writeup"
          {...register("writeup")}
          placeholder="Solution writeup"
          className="glass border-neon-cyan/30"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-neon-cyan text-dark-bg hover:shadow-cyan-glow"
          disabled={createChallenge.isPending || updateChallenge.isPending}
        >
          {challenge ? "Update Challenge" : "Create Challenge"}
        </Button>
      </div>
    </form>
  );
}

export default function ChallengeManagement() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: challenges = [], isLoading } = useQuery({
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

  const deleteChallenge = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete challenge");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      toast({ title: "Challenge deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete challenge", variant: "destructive" });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "hard": return "bg-orange-500";
      case "insane": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neon-cyan">Challenge Management</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon-green text-dark-bg hover:shadow-neon">
              <i className="fas fa-plus mr-2"></i>Add Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-neon-cyan max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan">
                {selectedChallenge ? "Edit Challenge" : "Create New Challenge"}
              </DialogTitle>
              <DialogDescription>
                {selectedChallenge ? "Update the challenge details below." : "Fill in the details to create a new challenge."}
              </DialogDescription>
            </DialogHeader>
            <ChallengeForm
              challenge={selectedChallenge}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedChallenge(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-neon-cyan">
        <CardHeader>
          <CardTitle className="text-neon-cyan">All Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading challenges...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Solves</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge: Challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-neon-cyan/20 text-neon-cyan">
                        {challenge.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{challenge.points}</TableCell>
                    <TableCell>{challenge.solves}</TableCell>
                    <TableCell>{challenge.author}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedChallenge(challenge);
                            setIsFormOpen(true);
                          }}
                          className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteChallenge.mutate(challenge.id)}
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