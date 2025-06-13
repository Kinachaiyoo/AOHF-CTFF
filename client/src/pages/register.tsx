import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast({
        title: "Registration Successful",
        description: "Welcome to CyberCTF! Your account has been created.",
        className: "border-green-500 bg-green-900/20",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg cyber-grid">
      <div className="w-full max-w-md mx-4">
        <Card className="glass border-neon-cyan">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="font-orbitron text-3xl font-bold neon-green mb-2">
                <i className="fas fa-shield-alt mr-2"></i>CyberCTF
              </div>
              <div className="font-mono text-sm text-gray-400">
                root@cyberctf:~$ ./register.sh
              </div>
              <div className="font-mono text-xs text-neon-cyan">
                Creating new user account...
              </div>
            </div>
            <CardTitle className="neon-cyan font-mono">NEW USER REGISTRATION</CardTitle>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="neon-cyan font-mono">Username:</FormLabel>
                      <FormControl>
                        <div className="flex items-center terminal-input rounded p-3">
                          <span className="neon-green mr-2 font-mono">$</span>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Choose username"
                            className="bg-transparent border-none text-green-300 font-mono focus:ring-0"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="neon-cyan font-mono">Email:</FormLabel>
                      <FormControl>
                        <div className="flex items-center terminal-input rounded p-3">
                          <span className="neon-green mr-2 font-mono">$</span>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter email address"
                            className="bg-transparent border-none text-green-300 font-mono focus:ring-0"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="neon-cyan font-mono">Password:</FormLabel>
                      <FormControl>
                        <div className="flex items-center terminal-input rounded p-3">
                          <span className="neon-green mr-2 font-mono">$</span>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter secure password"
                            className="bg-transparent border-none text-green-300 font-mono focus:ring-0"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="neon-cyan font-mono">Confirm Password:</FormLabel>
                      <FormControl>
                        <div className="flex items-center terminal-input rounded p-3">
                          <span className="neon-green mr-2 font-mono">$</span>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Confirm password"
                            className="bg-transparent border-none text-green-300 font-mono focus:ring-0"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 font-mono text-sm" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neon-cyan text-dark-bg font-bold py-3 hover:shadow-cyan-glow transition-all duration-300 font-mono"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus mr-2"></i>
                      CREATE ACCOUNT
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button variant="link" className="neon-green hover:neon-cyan transition-colors duration-300 font-mono">
                  Already have an account? Login here
                </Button>
              </Link>
            </div>

            {/* Security requirements */}
            <div className="mt-6 font-mono text-xs text-gray-500 space-y-1">
              <div className="neon-cyan">Password Requirements:</div>
              <div>├─ Minimum 8 characters</div>
              <div>├─ Uppercase & lowercase letters</div>
              <div>├─ At least one number</div>
              <div>└─ Special character (@$!%*?&)</div>
            </div>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:neon-cyan">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
