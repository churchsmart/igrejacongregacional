import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit } from 'lucide-react';
import { useChurchSettings } from '@/hooks/useChurchSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ChurchSettingsForm from '@/components/ChurchSettingsForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChurchSettings {
  id: string;
  church_name: string;
  logo_url?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  social_links?: Record<string, string>;
  updated_at: string;
}

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings, isLoading, error } = useChurchSettings();
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Omit<ChurchSettings, 'id' | 'updated_at' | 'social_links'>) => {
      if (!settings?.id) {
        // Criar configurações se não existirem
        const { data, error } = await supabase
          .from('church_settings')
          .insert({
            ...updatedSettings,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data;
      } else {
        // Atualizar configurações existentes
        const { data, error } = await supabase
          .from('church_settings')
          .update({
            ...updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select()
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churchSettings'] });
      toast.success('Configurações da igreja atualizadas com sucesso!');
      setIsFormOpen(false);
    },
    onError: (err) => {
      toast.error('Erro ao atualizar configurações: ' + err.message);
    },
  });

  const handleFormSubmit = (values: any) => {
    updateSettingsMutation.mutate(values);
  };

  const canEditSettings = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar configurações: {error.message}</p>;
  }

  if (!canEditSettings) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Você não tem permissão para acessar esta página.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Configurações da Igreja</CardTitle>
        {canEditSettings && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar Configurações
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aqui você poderá atualizar as informações gerais da igreja.
        </p>
        {settings ? (
          <div className="space-y-2">
            <p><strong>Nome da Igreja:</strong> {settings.church_name}</p>
            <p><strong>Descrição:</strong> {settings.description || 'N/A'}</p>
            <p><strong>Email de Contato:</strong> {settings.contact_email || 'N/A'}</p>
            <p><strong>Telefone de Contato:</strong> {settings.contact_phone || 'N/A'}</p>
            <p><strong>URL do Logo:</strong> {settings.logo_url ? <a href={settings.logo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{settings.logo_url}</a> : 'N/A'}</p>
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma configuração encontrada. Clique em "Editar Configurações" para adicionar.</p>
        )}
      </CardContent>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{settings ? 'Editar Configurações da Igreja' : 'Adicionar Configurações da Igreja'}</DialogTitle>
            <DialogDescription>
              {settings ? 'Atualize as informações gerais da sua igreja.' : 'Adicione as informações iniciais da sua igreja.'}
            </DialogDescription>
          </DialogHeader>
          <ChurchSettingsForm 
            initialData={settings || undefined} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
            isSubmitting={updateSettingsMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SettingsPage;