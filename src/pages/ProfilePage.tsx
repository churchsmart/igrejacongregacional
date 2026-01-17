import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Edit, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ProfileForm from '@/components/ProfileForm';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
  bio?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  updated_at: string;
}

interface ConfirmedEvent {
  event_id: string;
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}

const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user, loading: sessionLoading } = useSession();

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<Profile, Error>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!user?.id && !sessionLoading,
  });

  const { data: confirmedEvents, isLoading: eventsLoading } = useQuery<ConfirmedEvent[], Error>({
    queryKey: ['confirmedEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('user_confirmed_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!user?.id && !sessionLoading,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Perfil atualizado com sucesso!');
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const handleFormSubmit = (values: any) => {
    updateProfileMutation.mutate(values);
  };

  if (sessionLoading || profileLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return <p className="text-red-500">Erro ao carregar perfil: {profileError.message}</p>;
  }

  if (!profile) {
    return <p className="text-gray-500">Perfil não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Meu Perfil</CardTitle>
          <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
              <div className="space-y-2">
                <p><strong>Nome:</strong> {profile.first_name} {profile.last_name}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Telefone:</strong> {profile.phone || 'N/A'}</p>
                <p><strong>Endereço:</strong> {profile.address || 'N/A'}</p>
                <p><strong>Data de Nascimento:</strong> {profile.birth_date ? format(new Date(profile.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
                <p><strong>Bio:</strong> {profile.bio || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações da Igreja</h3>
              <div className="space-y-2">
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Membro desde:</strong> {profile.updated_at ? format(new Date(profile.updated_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Eventos Confirmados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Local</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedEvents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Você ainda não confirmou presença em nenhum evento.
                    </TableCell>
                  </TableRow>
                ) : (
                  confirmedEvents?.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(new Date(event.event_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>
                        {event.start_time && event.end_time ? 
                          `${event.start_time} - ${event.end_time}` : 
                          event.start_time || event.end_time || 'N/A'}
                      </TableCell>
                      <TableCell>{event.location || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais.
            </DialogDescription>
          </DialogHeader>
          <ProfileForm 
            initialData={profile} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
            isSubmitting={updateProfileMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;