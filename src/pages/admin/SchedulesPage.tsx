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
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, Users } from 'lucide-react';
import { toast } from 'sonner';
import ScheduleForm from '@/components/ScheduleForm';
import ScheduleMemberForm from '@/components/ScheduleMemberForm';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  title: string;
  description?: string;
  schedule_date: string; // ISO string
  start_time?: string;
  end_time?: string;
  department_id?: string;
  department_name?: string; // Joined from departments table
  created_by?: string; // User ID
  created_at: string;
  updated_at: string;
}

interface ScheduleMember {
  id: string;
  schedule_id: string;
  member_id: string;
  member_name: string;
  role: string;
}

const SchedulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<ScheduleMember | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();
  const { user: currentUser } = useSession();

  const { data: schedules, isLoading: schedulesLoading, error: schedulesError } = useQuery<Schedule[], Error>({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, departments(name)') // Select department name
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(schedule => ({
        ...schedule,
        department_name: (schedule as any).departments?.name || 'N/A',
      })) as Schedule[];
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const { data: scheduleMembers, isLoading: membersLoading } = useQuery<ScheduleMember[], Error>({
    queryKey: ['scheduleMembers', currentScheduleId],
    queryFn: async () => {
      if (!currentScheduleId) return [];

      const { data, error } = await supabase
        .from('schedule_members')
        .select('*, members(first_name, last_name)')
        .eq('schedule_id', currentScheduleId);

      if (error) {
        throw new Error(error.message);
      }

      return data.map(member => ({
        ...member,
        member_name: `${(member as any).members?.first_name || ''} ${(member as any).members?.last_name || ''}`.trim(),
      })) as ScheduleMember[];
    },
    enabled: !!currentScheduleId && !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor'),
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (newSchedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'department_name' | 'created_by'>) => {
      if (!currentUser?.id) throw new Error("User not authenticated.");
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          ...newSchedule,
          schedule_date: format(newSchedule.schedule_date, 'yyyy-MM-dd'),
          department_id: newSchedule.department_id || null,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Escala criada com sucesso!');
      setIsScheduleFormOpen(false);
      setEditingSchedule(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar escala: ' + error.message);
      console.error("[SchedulesPage] Create schedule error:", error);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (updatedSchedule: Omit<Schedule, 'created_at' | 'updated_at' | 'department_name' | 'created_by'>) => {
      const { id, schedule_date, department_id, ...rest } = updatedSchedule;
      const { data, error } = await supabase
        .from('schedules')
        .update({
          ...rest,
          schedule_date: format(new Date(schedule_date), 'yyyy-MM-dd'),
          department_id: department_id || null,
          updated_at: new Date().toISOString(),
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
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Escala atualizada com sucesso!');
      setIsScheduleFormOpen(false);
      setEditingSchedule(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar escala: ' + error.message);
      console.error("[SchedulesPage] Update schedule error:", error);
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw new Error(error.message);
      }
      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Escala excluída com sucesso!');
      setCurrentScheduleId(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir escala: ' + error.message);
      console.error("[SchedulesPage] Delete schedule error:", error);
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (newMember: { schedule_id: string; member_id: string; role: string }) => {
      const { data, error } = await supabase
        .from('schedule_members')
        .insert(newMember)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleMembers', currentScheduleId] });
      toast.success('Membro adicionado à escala com sucesso!');
      setIsMemberFormOpen(false);
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error('Erro ao adicionar membro: ' + error.message);
      console.error("[SchedulesPage] Create member error:", error);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (updatedMember: { id: string; schedule_id: string; member_id: string; role: string }) => {
      const { id, ...rest } = updatedMember;
      const { data, error } = await supabase
        .from('schedule_members')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleMembers', currentScheduleId] });
      toast.success('Membro atualizado com sucesso!');
      setIsMemberFormOpen(false);
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar membro: ' + error.message);
      console.error("[SchedulesPage] Update member error:", error);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('schedule_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message);
      }
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleMembers', currentScheduleId] });
      toast.success('Membro removido da escala com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover membro: ' + error.message);
      console.error("[SchedulesPage] Delete member error:", error);
    },
  });

  const handleScheduleFormSubmit = (values: any) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ ...values, id: editingSchedule.id });
    } else {
      createScheduleMutation.mutate(values);
    }
  };

  const handleMemberFormSubmit = (values: any) => {
    if (!currentScheduleId) return;

    if (editingMember) {
      updateMemberMutation.mutate({ ...values, id: editingMember.id, schedule_id: currentScheduleId });
    } else {
      createMemberMutation.mutate({ ...values, schedule_id: currentScheduleId });
    }
  };

  const openCreateScheduleDialog = () => {
    setEditingSchedule(null);
    setIsScheduleFormOpen(true);
  };

  const openEditScheduleDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleFormOpen(true);
  };

  const openViewMembersDialog = (scheduleId: string) => {
    setCurrentScheduleId(scheduleId);
  };

  const openAddMemberDialog = () => {
    setEditingMember(null);
    setIsMemberFormOpen(true);
  };

  const openEditMemberDialog = (member: ScheduleMember) => {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta escala? Esta ação é irreversível.')) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro da escala?')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const canManageSchedules = currentUserRole && ['master', 'admin', 'leader', 'editor'].includes(currentUserRole);
  const canDeleteSchedules = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || schedulesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (schedulesError) {
    return <p className="text-red-500">Erro ao carregar escalas: {schedulesError.message}</p>;
  }

  if (!canManageSchedules && currentUserRole !== 'member') {
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
        <CardTitle className="text-2xl font-bold">Gerenciar Escalas</CardTitle>
        {canManageSchedules && (
          <Button onClick={openCreateScheduleDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Escala
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Criação e gerenciamento de escalas de louvor e ministérios.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma escala encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                schedules?.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell>{format(new Date(schedule.schedule_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>
                      {schedule.start_time && schedule.end_time
                        ? `${schedule.start_time} - ${schedule.end_time}`
                        : schedule.start_time || schedule.end_time || 'N/A'}
                    </TableCell>
                    <TableCell>{schedule.department_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewMembersDialog(schedule.id)}
                      >
                        <Users className="mr-2 h-3 w-3" />
                        Ver Membros
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManageSchedules && (
                            <DropdownMenuItem onClick={() => openEditScheduleDialog(schedule)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canDeleteSchedules && (
                            <DropdownMenuItem onClick={() => handleDeleteSchedule(schedule.id)} className="text-red-600">
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

        {/* Schedule Form Dialog */}
        <Dialog open={isScheduleFormOpen} onOpenChange={setIsScheduleFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Editar Escala' : 'Adicionar Nova Escala'}</DialogTitle>
              <DialogDescription>
                {editingSchedule
                  ? 'Faça alterações na escala aqui.'
                  : 'Crie uma nova escala para sua igreja.'}
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              initialData={editingSchedule || undefined}
              onSubmit={handleScheduleFormSubmit}
              onCancel={() => setIsScheduleFormOpen(false)}
              isSubmitting={createScheduleMutation.isPending || updateScheduleMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Members Management Dialog */}
        <Dialog open={!!currentScheduleId} onOpenChange={() => setCurrentScheduleId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Membros da Escala</DialogTitle>
              <DialogDescription>
                Gerencie os membros participantes desta escala.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    {canManageSchedules && (
                      <Button onClick={openAddMemberDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Membro
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduleMembers?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              Nenhum membro nesta escala.
                            </TableCell>
                          </TableRow>
                        ) : (
                          scheduleMembers?.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.member_name}</TableCell>
                              <TableCell>{member.role}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canManageSchedules && (
                                      <DropdownMenuItem onClick={() => openEditMemberDialog(member)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                      </DropdownMenuItem>
                                    )}
                                    {canManageSchedules && (
                                      <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Remover
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
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Form Dialog */}
        <Dialog open={isMemberFormOpen} onOpenChange={setIsMemberFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Editar Membro na Escala' : 'Adicionar Membro à Escala'}</DialogTitle>
              <DialogDescription>
                {editingMember
                  ? 'Atualize as informações do membro nesta escala.'
                  : 'Adicione um membro e seu papel nesta escala.'}
              </DialogDescription>
            </DialogHeader>
            <ScheduleMemberForm
              scheduleId={currentScheduleId || ''}
              initialData={editingMember || undefined}
              onSubmit={handleMemberFormSubmit}
              onCancel={() => setIsMemberFormOpen(false)}
              isSubmitting={createMemberMutation.isPending || updateMemberMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SchedulesPage;