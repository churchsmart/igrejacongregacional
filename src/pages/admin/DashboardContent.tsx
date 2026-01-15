import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChurchSettings } from '@/hooks/useChurchSettings';
import { Loader2 } from 'lucide-react';

const AdminDashboardContent: React.FC = () => {
  const { settings, isLoading } = useChurchSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full text-center">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          Bem-vindo ao Painel de Administração {settings?.church_name ? `da ${settings.church_name}` : ''}!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Use o menu lateral para navegar pelas funcionalidades.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardContent;