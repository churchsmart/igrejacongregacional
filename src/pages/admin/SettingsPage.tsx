import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChurchSettings } from '@/hooks/useChurchSettings';
import { Loader2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, isLoading, error } = useChurchSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar configurações: {error.message}</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Configurações da Igreja</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Aqui você poderá atualizar as informações gerais da igreja.
        </p>
        {settings ? (
          <div className="space-y-2">
            <p><strong>Nome da Igreja:</strong> {settings.church_name}</p>
            <p><strong>Descrição:</strong> {settings.description || 'N/A'}</p>
            <p><strong>Email de Contato:</strong> {settings.contact_email || 'N/A'}</p>
            <p><strong>Telefone de Contato:</strong> {settings.contact_phone || 'N/A'}</p>
            {/* Add more fields as needed */}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma configuração encontrada. Por favor, adicione uma.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingsPage;