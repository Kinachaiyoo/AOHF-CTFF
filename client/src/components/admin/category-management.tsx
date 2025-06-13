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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  challengeCount?: number;
  createdAt: string;
}

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
    } : {
      color: "#00ffff",
      icon: "fas fa-code",
    }
  });

  const createCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch(`/api/admin/categories/${category!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (category) {
      updateCategory.mutate(data);
    } else {
      createCategory.mutate(data);
    }
  };

  const commonCategories = [
    { name: "Web", icon: "fas fa-globe", color: "#00ffff" },
    { name: "Cryptography", icon: "fas fa-key", color: "#ff6b6b" },
    { name: "Pwn", icon: "fas fa-bug", color: "#4ecdc4" },
    { name: "Reverse Engineering", icon: "fas fa-cogs", color: "#45b7d1" },
    { name: "Forensics", icon: "fas fa-search", color: "#96ceb4" },
    { name: "OSINT", icon: "fas fa-eye", color: "#feca57" },
    { name: "Steganography", icon: "fas fa-image", color: "#ff9ff3" },
    { name: "Misc", icon: "fas fa-puzzle-piece", color: "#a8e6cf" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter category name"
            className="glass border-neon-cyan/30"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="icon">Icon Class</Label>
          <Input
            id="icon"
            {...register("icon")}
            placeholder="fas fa-code"
            className="glass border-neon-cyan/30"
          />
          {errors.icon && <p className="text-red-400 text-sm mt-1">{errors.icon.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Category description"
          className="glass border-neon-cyan/30"
        />
        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="color">Color (Hex)</Label>
        <Input
          id="color"
          {...register("color")}
          placeholder="#00ffff"
          className="glass border-neon-cyan/30"
        />
        {errors.color && <p className="text-red-400 text-sm mt-1">{errors.color.message}</p>}
      </div>

      {!category && (
        <div>
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {commonCategories.map((template) => (
              <Button
                key={template.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  (document.getElementById("name") as HTMLInputElement).value = template.name;
                  (document.getElementById("icon") as HTMLInputElement).value = template.icon;
                  (document.getElementById("color") as HTMLInputElement).value = template.color;
                }}
                className="glass border-neon-cyan/30 text-left justify-start"
              >
                <i className={`${template.icon} mr-2`} style={{ color: template.color }}></i>
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-neon-cyan text-dark-bg hover:shadow-cyan-glow"
          disabled={createCategory.isPending || updateCategory.isPending}
        >
          {category ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

export default function CategoryManagement() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neon-cyan">Category Management</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon-green text-dark-bg hover:shadow-neon">
              <i className="fas fa-plus mr-2"></i>Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-neon-cyan max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan">
                {selectedCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory ? "Update the category details below." : "Create a new challenge category."}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedCategory(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-neon-cyan">
        <CardHeader>
          <CardTitle className="text-neon-cyan">All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Challenges</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Badge style={{ backgroundColor: category.color + '20', color: category.color }}>
                        <i className={`${category.icon} mr-2`}></i>
                        {category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <i className={category.icon} style={{ color: category.color }}></i>
                      <span className="ml-2 text-sm text-gray-400">{category.icon}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm">{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.challengeCount || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsFormOpen(true);
                          }}
                          className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCategory.mutate(category.id)}
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