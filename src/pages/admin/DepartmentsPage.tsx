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
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DepartmentForm from '@/components/DepartmentForm';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const DepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader'),
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (newDepartment: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(newDepartment)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento criado com sucesso!');
      setIsFormOpen(false);
      setEditingDepartment(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar departamento: ' + error.message);
      console.error("[DepartmentsPage] Create department error:", error);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (updatedDepartment: Department) => {
      const { data, error } = await supabase
        .from('departments')
        .update({ name: updatedDepartment.name, description: updatedDepartment.description, updated_at: new Date().toISOString() })
        .eq('id', updatedDepartment.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento atualizado com sucesso!');
      setIsFormOpen(false);
      setEditingDepartment(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar departamento: ' + error.message);
      console.error("[DepartmentsPage] Update department error:", error);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) {
        throw new Error(error.message);
      }
      return departmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir departamento: ' + error.message);
      console.error("[DepartmentsPage] Delete department error:", error);
    },
  });

  const handleFormSubmit = (values: any) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ ...values, id: editingDepartment.id, created_at: editingDepartment.created_at, updated_at: editingDepartment.updated_at });
    } else {
      createDepartmentMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este departamento? Esta ação é irreversível.')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  if (roleLoading || departmentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (departmentsError) {
    return <p className="text-red-500">Erro ao carregar departamentos: {departmentsError.message}</p>;
  }

  if (currentUserRole !== 'master' && currentUserRole !== 'admin' && currentUserRole !== 'leader') {
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
        <CardTitle className="text-2xl font-bold">Gerenciar Departamentos / Ministérios</CardTitle>
        {(currentUserRole === 'master' || currentUserRole === 'admin') && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Departamento
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          CRUD completo de departamentos e vinculação de membros.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum departamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                departments?.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <Loader2 className="h-4 w-4" /> {/* Placeholder for more-horizontal icon */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(currentUserRole === 'master' || currentUserRole === 'admin') && (
                            <DropdownMenuItem onClick={() => openEditDialog(department)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {(currentUserRole === 'master' || currentUserRole === 'admin') && (
                            <DropdownMenuItem onClick={() => handleDeleteDepartment(department.id)} className="text-red-600">
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
              <DialogTitle>{editingDepartment ? 'Editar Departamento' : 'Adicionar Novo Departamento'}</DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? 'Faça alterações no departamento aqui.'
                  : 'Crie um novo departamento para organizar sua igreja.'}
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm
              initialData={editingDepartment || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DepartmentsPage;