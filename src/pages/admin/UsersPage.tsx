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
import UserForm from '@/components/UserForm';
import { UserRole, useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  updated_at: string;
}

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<UserProfile[], Error>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, updated_at, auth_users(email)')
        .order('first_name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Map to include email from auth.users
      return data.map(profile => ({
        ...profile,
        email: (profile as any).auth_users?.email || 'N/A',
      })) as UserProfile[];
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin'),
  });

  const createUserMutation = useMutation({
    mutationFn: async (newUser: { email: string; password?: string; first_name: string; last_name: string; role: UserRole }) => {
      const { email, password, first_name, last_name, role } = newUser;

      // Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password || '', // Password is required for signUp
        options: {
          data: { first_name, last_name, role }, // Pass profile data to trigger handle_new_user
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('User creation failed: No user data returned.');
      }

      // If handle_new_user trigger doesn't set the role, update it explicitly
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ role, first_name, last_name })
        .eq('id', authData.user.id);

      if (profileUpdateError) {
        // If profile update fails, consider rolling back auth user or logging
        console.error("[UsersPage] Failed to update profile role after signup:", profileUpdateError.message);
        // Optionally, delete the auth user if profile update is critical
        // await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to set user role after creation.');
      }

      return { ...newUser, id: authData.user.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Usuário criado com sucesso!');
      setIsFormOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
      console.error("[UsersPage] Create user error:", error);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: { id: string; email: string; first_name: string; last_name: string; role: UserRole }) => {
      const { id, email, first_name, last_name, role } = updatedUser;

      // Update user email in auth.users if changed
      if (editingUser?.email !== email) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, { email });
        if (authUpdateError) {
          throw new Error(authUpdateError.message);
        }
      }

      // Update profile data
      const { data, error } = await supabase
        .from('profiles')
        .update({ first_name, last_name, role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Usuário atualizado com sucesso!');
      setIsFormOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar usuário: ' + error.message);
      console.error("[UsersPage] Update user error:", error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Supabase admin API to delete user from auth.users, which cascades to profiles
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        throw new Error(error.message);
      }
      return userId;
    },
    onSuccess: (deletedUserId) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Usuário desativado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao desativar usuário: ' + error.message);
      console.error("[UsersPage] Delete user error:", error);
    },
  });

  const handleFormSubmit = (values: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ ...values, id: editingUser.id });
    } else {
      createUserMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja desativar este usuário? Esta ação é irreversível.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (roleLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (usersError) {
    return <p className="text-red-500">Erro ao carregar usuários: {usersError.message}</p>;
  }

  if (currentUserRole !== 'master' && currentUserRole !== 'admin') {
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
        <CardTitle className="text-2xl font-bold">Gerenciar Usuários</CardTitle>
        {(currentUserRole === 'master' || currentUserRole === 'admin') && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aqui você poderá criar, editar e desativar usuários, além de definir suas roles.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Sobrenome</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.first_name}</TableCell>
                    <TableCell>{user.last_name}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'master' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <Loader2 className="h-4 w-4" /> {/* Using Loader2 as a placeholder for more-horizontal icon */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(currentUserRole === 'master' || currentUserRole === 'admin') && (
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {currentUserRole === 'master' && user.role !== 'master' && ( // Only master can delete, and not master user itself
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Desativar
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
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Faça alterações no perfil do usuário aqui.'
                  : 'Crie um novo usuário e atribua uma role.'}
              </DialogDescription>
            </DialogHeader>
            <UserForm
              initialData={editingUser || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UsersPage;