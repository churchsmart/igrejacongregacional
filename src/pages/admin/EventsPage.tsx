import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import EventForm from '@/components/EventForm';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string; // ISO string
  start_time?: string;
  end_time?: string;
  location?: string;
  image_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const EventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();
  const { user: currentUser } = useSession();

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: async () => {
      console.log("[EventsPage] Fetching events");
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error("[EventsPage] Error fetching events:", error);
        throw new Error(error.message);
      }
      
      console.log("[EventsPage] Events fetched:", data);
      return data;
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!currentUser?.id) throw new Error("User not authenticated.");
      console.log("[EventsPage] Creating event:", newEvent);
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...newEvent,
          event_date: format(newEvent.event_date, 'yyyy-MM-dd'),
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[EventsPage] Error creating event:", error);
        throw new Error(error.message);
      }
      
      console.log("[EventsPage] Event created:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento criado com sucesso!');
      setIsFormOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar evento: ' + error.message);
      console.error("[EventsPage] Create event error:", error);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: Omit<Event, 'created_at' | 'updated_at' | 'created_by'>) => {
      console.log("[EventsPage] Updating event:", updatedEvent);
      const { id, event_date, ...rest } = updatedEvent;
      const { data, error } = await supabase
        .from('events')
        .update({
          ...rest,
          event_date: format(new Date(event_date), 'yyyy-MM-dd'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("[EventsPage] Error updating event:", error);
        throw new Error(error.message);
      }
      
      console.log("[EventsPage] Event updated:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento atualizado com sucesso!');
      setIsFormOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar evento: ' + error.message);
      console.error("[EventsPage] Update event error:", error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      console.log("[EventsPage] Deleting event:", eventId);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error("[EventsPage] Error deleting event:", error);
        throw new Error(error.message);
      }
      
      console.log("[EventsPage] Event deleted:", eventId);
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir evento: ' + error.message);
      console.error("[EventsPage] Delete event error:", error);
    },
  });

  const handleFormSubmit = (values: any) => {
    console.log("[EventsPage] Form submitted:", values);
    if (editingEvent) {
      updateEventMutation.mutate({ ...values, id: editingEvent.id });
    } else {
      createEventMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento? Esta ação é irreversível.')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const canManageEvents = currentUserRole && ['master', 'admin', 'editor'].includes(currentUserRole);
  const canDeleteEvents = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventsError) {
    return <p className="text-red-500">Erro ao carregar eventos: {eventsError.message}</p>;
  }

  if (!canManageEvents && currentUserRole !== 'member') {
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
        <CardTitle className="text-2xl font-bold">Gerenciar Eventos</CardTitle>
        {canManageEvents && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Evento
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Agenda da igreja com datas e descrições de eventos.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum evento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                events?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{format(new Date(event.event_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {event.start_time && event.end_time
                        ? `${event.start_time} - ${event.end_time}`
                        : event.start_time || event.end_time || 'N/A'}
                    </TableCell>
                    <TableCell>{event.location || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManageEvents && (
                            <DropdownMenuItem onClick={() => openEditDialog(event)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canDeleteEvents && (
                            <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? 'Faça alterações no evento aqui.'
                  : 'Crie um novo evento para sua igreja.'}
              </DialogDescription>
            </DialogHeader>
            <EventForm
              initialData={editingEvent || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createEventMutation.isPending || updateEventMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EventsPage;