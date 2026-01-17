import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, UploadCloud, Trash2, FileText, Image as ImageIcon, ChevronLeft, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { useSearchParams, Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MediaFile {
  name: string;
  id: string;
  url: string;
  created_at: string;
}

interface Gallery {
  id: string;
  title: string;
}

const BUCKET_NAME = 'media';

const MediaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentGalleryId, setCurrentGalleryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  // Obter ID da galeria dos parâmetros da URL
  useEffect(() => {
    const galleryId = searchParams.get('gallery');
    if (galleryId) {
      setCurrentGalleryId(galleryId);
    } else {
      setCurrentGalleryId(null);
    }
  }, [searchParams]);

  const { data: galleries, isLoading: galleriesLoading } = useQuery<Gallery[], Error>({
    queryKey: ['galleries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galleries')
        .select('id, title')
        .order('title', { ascending: true });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const { data: mediaFiles, isLoading: mediaLoading, error: mediaError } = useQuery<MediaFile[], Error>({
    queryKey: ['mediaFiles', currentGalleryId],
    queryFn: async () => {
      if (currentGalleryId) {
        // Obter imagens de uma galeria específica
        const { data: galleryImages, error: galleryImagesError } = await supabase
          .from('gallery_images')
          .select('image_url')
          .eq('gallery_id', currentGalleryId);
        
        if (galleryImagesError) {
          throw new Error(galleryImagesError.message);
        }

        // Extrair nomes dos arquivos das URLs e obter seus metadados
        const filesWithUrls = await Promise.all(
          galleryImages.map(async (item) => {
            const filename = item.image_url.split('/').pop();
            if (!filename) return null;
            
            const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`galleries/${currentGalleryId}/${filename}`);
            
            return {
              name: filename,
              id: filename,
              url: publicUrlData.publicUrl,
              created_at: new Date().toISOString(), // Em produção, isso viria do banco
            };
          })
        );
        
        return filesWithUrls.filter(Boolean) as MediaFile[];
      } else {
        // Obter todos os arquivos do bucket de mídia
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });
        
        if (error) {
          throw new Error(error.message);
        }

        // Para cada arquivo, obter sua URL pública
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
            return {
              name: file.name,
              id: file.name,
              url: publicUrlData.publicUrl,
              created_at: file.created_at,
            };
          })
        );
        
        return filesWithUrls;
      }
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      let path = '';
      if (currentGalleryId) {
        path = `galleries/${currentGalleryId}/${Date.now()}_${file.name}`;
      } else {
        path = `${Date.now()}_${file.name}`;
      }
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        throw new Error(error.message);
      }

      // Se estiver enviando para uma galeria, também criar o registro em gallery_images
      if (currentGalleryId) {
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            gallery_id: currentGalleryId,
            image_url: `${BUCKET_NAME}/${path}`,
          });
        
        if (dbError) {
          throw new Error(dbError.message);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles', currentGalleryId] });
      toast.success('Arquivo enviado com sucesso!');
      setFileToUpload(null);
      setIsUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast.error('Erro ao enviar arquivo: ' + error.message);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileName: string) => {
      // Se estiver em modo de galeria, deletar primeiro de gallery_images
      if (currentGalleryId) {
        const { error: dbError } = await supabase
          .from('gallery_images')
          .delete()
          .eq('image_url', `${BUCKET_NAME}/galleries/${currentGalleryId}/${fileName}`);
        
        if (dbError) {
          throw new Error(dbError.message);
        }
      }

      // Deletar o arquivo real do storage
      const path = currentGalleryId ? `galleries/${currentGalleryId}/${fileName}` : fileName;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles', currentGalleryId] });
      toast.success('Arquivo excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir arquivo: ' + error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileToUpload(event.target.files[0]);
    } else {
      setFileToUpload(null);
    }
  };

  const handleUploadClick = () => {
    if (fileToUpload) {
      uploadFileMutation.mutate(fileToUpload);
    } else {
      toast.error('Por favor, selecione um arquivo para enviar.');
    }
  };

  const openDeleteDialog = (file: MediaFile) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete.name);
    }
  };

  const handleGalleryChange = (galleryId: string) => {
    setSearchParams({ gallery: galleryId });
  };

  const handleBackToGalleries = () => {
    setSearchParams({});
    setCurrentGalleryId(null);
  };

  const canManageMedia = currentUserRole && ['master', 'admin', 'editor'].includes(currentUserRole);
  const canDeleteMedia = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || galleriesLoading || mediaLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mediaError) {
    return <p className="text-red-500">Erro ao carregar arquivos de mídia: {mediaError.message}</p>;
  }

  if (!canManageMedia && currentUserRole !== 'member') {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {currentGalleryId ? (
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleBackToGalleries}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Imagens da Galeria</CardTitle>
            </div>
          ) : (
            <CardTitle className="text-2xl font-bold">Gerenciar Mídia</CardTitle>
          )}
          {canManageMedia && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <UploadCloud className="mr-2 h-4 w-4" /> Enviar Arquivo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!currentGalleryId ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Faça upload, visualize e gerencie arquivos de mídia para sua igreja.
              </p>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Selecione uma galeria:</h3>
                <Select onValueChange={handleGalleryChange}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Selecione uma galeria" />
                  </SelectTrigger>
                  <SelectContent>
                    {galleries?.map((gallery) => (
                      <SelectItem key={gallery.id} value={gallery.id}>
                        {gallery.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link to="/admin/galleries" className="text-sm">
                      <PlusCircle className="mr-1 h-3 w-3" /> Gerenciar Galerias
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gerencie as imagens desta galeria.
            </p>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pré-visualização</TableHead>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediaFiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {currentGalleryId ? 'Nenhuma imagem encontrada nesta galeria.' : 'Nenhum arquivo de mídia encontrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  mediaFiles?.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        {file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img src={file.url} alt={file.name} className="h-12 w-12 object-cover rounded-md" />
                        ) : (
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px] block">
                          {file.url}
                        </a>
                      </TableCell>
                      <TableCell>{format(new Date(file.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        {canDeleteMedia && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(file)}
                            disabled={deleteFileMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Novo Arquivo de Mídia</DialogTitle>
            <DialogDescription>
              {currentGalleryId ? 
                `Selecione um arquivo para adicionar à galeria.` : 
                `Selecione um arquivo do seu computador para fazer upload.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input 
              id="mediaFile" 
              type="file" 
              onChange={handleFileChange} 
              ref={fileInputRef} 
            />
            {fileToUpload && (
              <p className="text-sm text-muted-foreground">Arquivo selecionado: {fileToUpload.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={uploadFileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadClick} 
              disabled={!fileToUpload || uploadFileMutation.isPending}
            >
              {uploadFileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {uploadFileMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o arquivo "{fileToDelete?.name}"? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteFileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteFileMutation.isPending}
            >
              {deleteFileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {deleteFileMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPage;