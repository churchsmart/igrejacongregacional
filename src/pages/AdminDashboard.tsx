import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AdminDashboard] Logout error:", error.message);
      toast.error("Failed to log out: " + error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Welcome to the protected admin area! More features will be built here.
          </p>
          <Button onClick={handleLogout} variant="destructive">Logout</Button>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default AdminDashboard;