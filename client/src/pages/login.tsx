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

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast({
        title: "Login Successful",
        description: "Welcome back to CyberCTF!",
        className: "border-green-500 bg-green-900/20",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg cyber-grid">
      <div className="w-full max-w-md mx-4">
        <Card className="glass border-neon-green">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="font-orbitron text-3xl font-bold neon-green mb-2">
                <i className="fas fa-shield-alt mr-2"></i>CyberCTF
              </div>
              <div className="font-mono text-sm text-gray-400">
                root@cyberctf:~$ ./login.sh
              </div>
              <div className="font-mono text-xs text-neon-cyan">
                Initializing secure authentication...
              </div>
            </div>
            <CardTitle className="neon-cyan font-mono">SYSTEM LOGIN</CardTitle>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            placeholder="Enter username"
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
                            placeholder="Enter password"
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
                  className="w-full bg-neon-green text-dark-bg font-bold py-3 hover:shadow-neon transition-all duration-300 font-mono"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      AUTHENTICATE
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/register">
                <Button variant="link" className="neon-cyan hover:neon-green transition-colors duration-300 font-mono">
                  New user? Register here
                </Button>
              </Link>
            </div>

            {/* Terminal footer */}
            <div className="mt-8 font-mono text-xs text-gray-500 space-y-1">
              <div>└─ Connection established</div>
              <div>└─ Encryption: AES-256</div>
              <div className="flex items-center">
                └─ Status: 
                <span className="ml-1 neon-green animate-terminal-blink">READY</span>
              </div>
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
