import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
}

interface PrayerRequestWithUser extends PrayerRequest {
  user_email: string;
}

const PrayerRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: requests, isLoading: requestsLoading, error: requestsError } = useQuery<PrayerRequestWithUser[], Error>({
    queryKey: ['prayerRequests'],
    queryFn: async () => {
      // Obter pedidos de oração com dados do usuário
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*, user_email:auth.users(email)')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data.map(request => {
        const user_email = (request as any).user_email?.email || 'N/A';
        const { user_email: _, ...requestWithoutUserEmail } = request as any;
        return {
          ...requestWithoutUserEmail,
          user_email
        } as PrayerRequestWithUser;
      });
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin'),
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PrayerRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('prayer_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      toast.success('Pedido de oração atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pedido: ' + error.message);
    },
  });

  const handleTogglePublic = (id: string, isPublic: boolean) => {
    updateRequestMutation.mutate({ id, is_public: isPublic });
  };

  const handleToggleAnswered = (id: string, isAnswered: boolean) => {
    updateRequestMutation.mutate({ id, is_answered: isAnswered });
  };

  const canManageRequests = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requestsError) {
    return <p className="text-red-500">Erro ao carregar pedidos de oração: {requestsError.message}</p>;
  }

  if (!canManageRequests) {
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
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Mural de Oração</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Gerencie os pedidos de oração enviados pelos membros.
        </p>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Respondido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum pedido de oração encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user_email}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.description || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`public-${request.id}`}
                          checked={request.is_public}
                          onCheckedChange={(checked) => handleTogglePublic(request.id, checked)}
                        />
                        <Label htmlFor={`public-${request.id}`}>
                          {request.is_public ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`answered-${request.id}`}
                          checked={request.is_answered}
                          onCheckedChange={(checked) => handleToggleAnswered(request.id, checked)}
                        />
                        <Label htmlFor={`answered-${request.id}`}>
                          {request.is_answered ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrayerRequestsPage;