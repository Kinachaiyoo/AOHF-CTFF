import { Switch, Route, Link, useLocation } from "wouter";
import { useRequireAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChallengeManagement from "@/components/admin/challenge-management";
import UserManagement from "@/components/admin/user-management";
import CategoryManagement from "@/components/admin/category-management";
import AuthorManagement from "@/components/admin/author-management";

function AdminOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-neon-cyan">
          <CardHeader className="pb-2">
            <CardTitle className="text-neon-cyan">Total Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24</div>
            <p className="text-xs text-gray-400">Active challenges</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-neon-green">
          <CardHeader className="pb-2">
            <CardTitle className="text-neon-green">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">156</div>
            <p className="text-xs text-gray-400">Registered users</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-electric-yellow">
          <CardHeader className="pb-2">
            <CardTitle className="text-electric-yellow">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">6</div>
            <p className="text-xs text-gray-400">Challenge categories</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-hot-pink">
          <CardHeader className="pb-2">
            <CardTitle className="text-hot-pink">Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">8</div>
            <p className="text-xs text-gray-400">Challenge authors</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-neon-cyan">
        <CardHeader>
          <CardTitle className="text-neon-cyan">Recent Activity</CardTitle>
          <CardDescription>Latest platform activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-neon-green rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-white">New user registered: hacker123</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-electric-yellow rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Challenge solved: Web Exploitation 101</p>
                <p className="text-xs text-gray-400">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-hot-pink rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-white">New challenge published: Crypto Master</p>
                <p className="text-xs text-gray-400">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  useRequireAdmin();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-orbitron font-bold neon-cyan">
              <i className="fas fa-shield-alt mr-3"></i>Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage your CTF platform</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="glass border-neon-cyan">
              <i className="fas fa-home mr-2"></i>Back to Platform
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass bg-dark-card/50 border border-neon-cyan/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-neon-cyan/20">
              <i className="fas fa-chart-line mr-2"></i>Overview
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-neon-cyan/20">
              <i className="fas fa-flag mr-2"></i>Challenges
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/20">
              <i className="fas fa-users mr-2"></i>Users
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-neon-cyan/20">
              <i className="fas fa-tags mr-2"></i>Categories
            </TabsTrigger>
            <TabsTrigger value="authors" className="data-[state=active]:bg-neon-cyan/20">
              <i className="fas fa-user-edit mr-2"></i>Authors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>
          
          <TabsContent value="challenges">
            <ChallengeManagement />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
          
          <TabsContent value="authors">
            <AuthorManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}