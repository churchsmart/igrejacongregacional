import React from 'react';
import { Outlet, Link } from 'react-router-dom'; // Added Link import
import Sidebar from './Sidebar';
import { useChurchSettings } from '@/hooks/useChurchSettings';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MadeWithDyad } from './made-with-dyad';

const AdminLayout: React.FC = () => {
  const { settings, isLoading: settingsLoading, error: settingsError } = useChurchSettings();

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="p-8 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-300">Carregando configurações da igreja...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="p-8 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <p className="text-lg text-red-500">Erro ao carregar configurações: {settingsError.message}</p>
            <p className="text-md text-gray-600">Verifique se a tabela 'church_settings' existe e contém dados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const churchName = settings?.church_name || "Admin Dashboard";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar churchName={churchName} />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          {/* Mobile sidebar trigger is inside Sidebar component */}
          <Sidebar churchName={churchName} />
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold">{churchName}</span>
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet /> {/* This is where nested routes will render */}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminLayout;