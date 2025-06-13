import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const adminLoginSchema = z.object({
  username: z.literal("admin", { required_error: "Username must be 'admin'" }),
  password: z.literal("admin", { required_error: "Password must be 'admin'" }),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { adminLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    try {
      await adminLogin(data.username, data.password);
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard.",
        className: "border-green-500 bg-green-900/20",
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg cyber-grid">
      <div className="w-full max-w-md mx-4">
        <Card className="glass border-red-500">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="font-orbitron text-3xl font-bold text-red-500 mb-2">
                <i className="fas fa-shield-alt mr-2"></i>ADMIN ACCESS
              </div>
              <div className="font-mono text-sm text-gray-400">
                root@cyberctf:~$ sudo ./admin_login.sh
              </div>
              <div className="font-mono text-xs text-red-400">
                Authenticating administrative privileges...
              </div>
            </div>
            <CardTitle className="text-red-400 font-mono">RESTRICTED AREA</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded">
              <div className="flex items-center space-x-2 text-red-400">
                <i className="fas fa-exclamation-triangle"></i>
                <span className="font-mono text-sm">AUTHORIZED PERSONNEL ONLY</span>
              </div>
              <div className="font-mono text-xs text-gray-400 mt-2">
                This area is restricted to system administrators.
                All access attempts are logged and monitored.
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-400 font-mono">Admin Username:</FormLabel>
                      <FormControl>
                        <div className="flex items-center bg-dark-bg border border-red-500 rounded p-3">
                          <span className="text-red-500 mr-2 font-mono">#</span>
                          <Input
                            {...field}
                            type="text"
                            placeholder="admin"
                            className="bg-transparent border-none text-red-300 font-mono focus:ring-0"
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
                      <FormLabel className="text-red-400 font-mono">Admin Password:</FormLabel>
                      <FormControl>
                        <div className="flex items-center bg-dark-bg border border-red-500 rounded p-3">
                          <span className="text-red-500 mr-2 font-mono">#</span>
                          <Input
                            {...field}
                            type="password"
                            placeholder="admin"
                            className="bg-transparent border-none text-red-300 font-mono focus:ring-0"
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
                  className="w-full bg-red-600 text-white font-bold py-3 hover:bg-red-700 transition-all duration-300 font-mono"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      VERIFYING ACCESS...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-key mr-2"></i>
                      GRANT ACCESS
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Security Notice */}
            <div className="mt-8 font-mono text-xs text-gray-500 space-y-1">
              <div className="text-red-400">SECURITY NOTICE:</div>
              <div>├─ Connection encrypted with TLS 1.3</div>
              <div>├─ Multi-factor authentication required</div>
              <div>├─ Session timeout: 24 hours</div>
              <div>└─ All activities are logged</div>
            </div>

            {/* Default credentials hint */}
            <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-500 rounded">
              <div className="font-mono text-xs text-yellow-400">
                <i className="fas fa-info-circle mr-2"></i>
                Default credentials: admin / admin
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-red-400">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Main Site
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
