import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import NewsForm from '@/components/NewsForm';
import { useUserRole } from '@/hooks/useUserRole';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { Badge } from '@/components/ui/badge';

interface News {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const NewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();
  const { user: currentUser } = useSession();

  const { data: news, isLoading: newsLoading, error: newsError } = useQuery<News[], Error>({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor'),
  });

  const createNewsMutation = useMutation({
    mutationFn: async (newNews: Omit<News, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!currentUser?.id) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('news')
        .insert({
          ...newNews,
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
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('Notícia criada com sucesso!');
      setIsFormOpen(false);
      setEditingNews(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar notícia: ' + error.message);
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async (updatedNews: Omit<News, 'created_at' | 'updated_at' | 'created_by'>) => {
      const { id, ...rest } = updatedNews;
      
      const { data, error } = await supabase
        .from('news')
        .update({
          ...rest,
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
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('Notícia atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingNews(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar notícia: ' + error.message);
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', newsId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return newsId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('Notícia excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir notícia: ' + error.message);
    },
  });

  const handleFormSubmit = (values: any) => {
    if (editingNews) {
      updateNewsMutation.mutate({ ...values, id: editingNews.id });
    } else {
      createNewsMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingNews(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (newsItem: News) => {
    setEditingNews(newsItem);
    setIsFormOpen(true);
  };

  const handleDeleteNews = (newsId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia? Esta ação é irreversível.')) {
      deleteNewsMutation.mutate(newsId);
    }
  };

  const canManageNews = currentUserRole && ['master', 'admin', 'editor'].includes(currentUserRole);
  const canDeleteNews = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || newsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (newsError) {
    return <p className="text-red-500">Erro ao carregar notícias: {newsError.message}</p>;
  }

  if (!canManageNews) {
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
        <CardTitle className="text-2xl font-bold">Notícias e Avisos</CardTitle>
        {canManageNews && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Notícia
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Gerencie as notícias e avisos da igreja.
        </p>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Importante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma notícia encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                news?.map((newsItem) => (
                  <TableRow key={newsItem.id}>
                    <TableCell className="font-medium">{newsItem.title}</TableCell>
                    <TableCell>
                      {newsItem.is_important ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Importante
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(newsItem.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManageNews && (
                            <DropdownMenuItem onClick={() => openEditDialog(newsItem)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canDeleteNews && (
                            <DropdownMenuItem onClick={() => handleDeleteNews(newsItem.id)} className="text-red-600">
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
      </CardContent>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Editar Notícia' : 'Adicionar Nova Notícia'}</DialogTitle>
            <DialogDescription>
              {editingNews ? 'Faça alterações na notícia aqui.' : 'Crie uma nova notícia ou aviso para sua igreja.'}
            </DialogDescription>
          </DialogHeader>
          <NewsForm 
            initialData={editingNews || undefined} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
            isSubmitting={createNewsMutation.isPending || updateNewsMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NewsPage;