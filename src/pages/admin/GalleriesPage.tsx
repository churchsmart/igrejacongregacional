import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Edit, Trash2, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import GalleryForm from '@/components/GalleryForm';
import { useUserRole } from '@/hooks/useUserRole';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Gallery {
  id: string;
  title: string;
  created_at: string;
  image_count?: number;
}

const GalleriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: galleries, isLoading: galleriesLoading, error: galleriesError } = useQuery<Gallery[], Error>({
    queryKey: ['galleries'],
    queryFn: async () => {
      // Obter galerias
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (galleriesError) {
        throw new Error(galleriesError.message);
      }

      // Contar imagens para cada galeria
      const galleriesWithCounts = await Promise.all(
        galleriesData.map(async (gallery) => {
          const { count, error: countError } = await supabase
            .from('gallery_images')
            .select('*', { count: 'exact', head: true })
            .eq('gallery_id', gallery.id);
          
          if (countError) {
            console.error(`Error counting images for gallery ${gallery.id}:`, countError.message);
            return { ...gallery, image_count: 0 };
          }
          
          return { ...gallery, image_count: count || 0 };
        })
      );
      
      return galleriesWithCounts;
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const createGalleryMutation = useMutation({
    mutationFn: async (newGallery: { title: string }) => {
      const { data, error } = await supabase
        .from('galleries')
        .insert(newGallery)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      toast.success('Galeria criada com sucesso!');
      setIsFormOpen(false);
      setEditingGallery(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar galeria: ' + error.message);
    },
  });

  const updateGalleryMutation = useMutation({
    mutationFn: async (updatedGallery: Gallery) => {
      const { data, error } = await supabase
        .from('galleries')
        .update({ title: updatedGallery.title })
        .eq('id', updatedGallery.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      toast.success('Galeria atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingGallery(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar galeria: ' + error.message);
    },
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async (galleryId: string) => {
      // Primeiro deletar todas as imagens da galeria
      const { error: imagesError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('gallery_id', galleryId);
      
      if (imagesError) {
        throw new Error(imagesError.message);
      }

      // Depois deletar a galeria em si
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return galleryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      toast.success('Galeria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir galeria: ' + error.message);
    },
  });

  const handleFormSubmit = (values: any) => {
    if (editingGallery) {
      updateGalleryMutation.mutate({ ...values, id: editingGallery.id, created_at: editingGallery.created_at });
    } else {
      createGalleryMutation.mutate(values);
    }
  };

  const openCreateDialog = () => {
    setEditingGallery(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setIsFormOpen(true);
  };

  const handleDeleteGallery = (galleryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta galeria e todas as suas imagens? Esta ação é irreversível.')) {
      deleteGalleryMutation.mutate(galleryId);
    }
  };

  const canManageGalleries = currentUserRole && ['master', 'admin', 'editor'].includes(currentUserRole);
  const canDeleteGalleries = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || galleriesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (galleriesError) {
    return <p className="text-red-500">Erro ao carregar galerias: {galleriesError.message}</p>;
  }

  if (!canManageGalleries && currentUserRole !== 'member') {
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
        <CardTitle className="text-2xl font-bold">Gerenciar Galerias</CardTitle>
        {canManageGalleries && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Galeria
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Crie e gerencie galerias de imagens para eventos e atividades da igreja.
        </p>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Imagens</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {galleries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma galeria encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                galleries?.map((gallery) => (
                  <TableRow key={gallery.id}>
                    <TableCell className="font-medium">
                      <Link to={`/admin/media?gallery=${gallery.id}`} className="hover:underline">
                        {gallery.title}
                      </Link>
                    </TableCell>
                    <TableCell>{gallery.image_count || 0} imagem(ns)</TableCell>
                    <TableCell>{format(new Date(gallery.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManageGalleries && (
                            <DropdownMenuItem onClick={() => openEditDialog(gallery)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/media?gallery=${gallery.id}`} className="flex items-center w-full">
                              <ImageIcon className="mr-2 h-4 w-4" /> Ver Imagens
                            </Link>
                          </DropdownMenuItem>
                          {canDeleteGalleries && (
                            <DropdownMenuItem onClick={() => handleDeleteGallery(gallery.id)} className="text-red-600">
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
            <DialogTitle>{editingGallery ? 'Editar Galeria' : 'Adicionar Nova Galeria'}</DialogTitle>
            <DialogDescription>
              {editingGallery ? 'Faça alterações na galeria aqui.' : 'Crie uma nova galeria para organizar suas imagens.'}
            </DialogDescription>
          </DialogHeader>
          <GalleryForm 
            initialData={editingGallery || undefined} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
            isSubmitting={createGalleryMutation.isPending || updateGalleryMutation.isPending} 
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GalleriesPage;