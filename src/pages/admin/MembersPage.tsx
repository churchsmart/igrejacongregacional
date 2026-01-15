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
import MemberForm from '@/components/MemberForm';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  birth_date?: string; // ISO string
  department_id?: string;
  department_name?: string; // Joined from departments table
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const MembersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: members, isLoading: membersLoading, error: membersError } = useQuery<Member[], Error>({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*, departments(name)') // Select department name
        .order('first_name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(member => ({
        ...member,
        department_name: (member as any).departments?.name || 'N/A',
      })) as Member[];
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor'),
  });

  const createMemberMutation = useMutation({
    mutationFn: async (newMember: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'department_name'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...newMember,
          birth_date: newMember.birth_date ? format(newMember.birth_date, 'yyyy-MM-dd') : null,
          department_id: newMember.department_id || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro criado com sucesso!');
      setIsFormOpen(false);
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar membro: ' + error.message);
      console.error("[MembersPage] Create member error:", error);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (updatedMember: Omit<Member, 'created_at' | 'updated_at' | 'department_name'>) => {
      const { id, birth_date, department_id, ...rest } = updatedMember;
      const { data, error } = await supabase
        .from('members')
        .update({
          ...rest,
          birth_date: birth_date ? format(new Date(birth_date), 'yyyy-MM-dd') : null,
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
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro atualizado com sucesso!');
      setIsFormOpen(false);
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar membro: ' + error.message);
      console.error("[MembersPage] Update member error:", error);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message);
      }
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir membro: ' + error.message);
      console.error("[MembersPage] Delete member error:", error);
    },
  });

  const handleFormSubmit = (values: any) => {
    if (editingMember) {
      updateMemberMutation.mutate({ ...values, id: editingMember.id });
    } else {
      createMemberMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este membro? Esta ação é irreversível.')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const canManageMembers = currentUserRole && ['master', 'admin', 'leader', 'editor'].includes(currentUserRole);
  const canDeleteMembers = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (membersError) {
    return <p className="text-red-500">Erro ao carregar membros: {membersError.message}</p>;
  }

  if (!canManageMembers && currentUserRole !== 'member') { // 'member' role can't even view this page
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
        <CardTitle className="text-2xl font-bold">Gerenciar Membros</CardTitle>
        {canManageMembers && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Membro
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          CRUD completo de membros e relacionamento com departamentos.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                    <TableCell>{member.email || 'N/A'}</TableCell>
                    <TableCell>{member.phone || 'N/A'}</TableCell>
                    <TableCell>{member.department_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
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
                          {canManageMembers && (
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canDeleteMembers && (
                            <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="text-red-600">
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
              <DialogTitle>{editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
              <DialogDescription>
                {editingMember
                  ? 'Faça alterações no perfil do membro aqui.'
                  : 'Crie um novo membro e vincule-o a um departamento.'}
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              initialData={editingMember || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createMemberMutation.isPending || updateMemberMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MembersPage;