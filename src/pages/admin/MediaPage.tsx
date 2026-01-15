import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, UploadCloud, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

interface MediaFile {
  name: string;
  id: string;
  url: string;
  created_at: string;
}

const BUCKET_NAME = 'media';

const MediaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const { data: mediaFiles, isLoading: mediaLoading, error: mediaError } = useQuery<MediaFile[], Error>({
    queryKey: ['mediaFiles'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        throw new Error(error.message);
      }

      // For each file, get its public URL
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
    },
    enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`${Date.now()}_${file.name}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      toast.success('Arquivo enviado com sucesso!');
      setFileToUpload(null);
      setIsUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast.error('Erro ao enviar arquivo: ' + error.message);
      console.error("[MediaPage] Upload file error:", error);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      toast.success('Arquivo excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir arquivo: ' + error.message);
      console.error("[MediaPage] Delete file error:", error);
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

  const canManageMedia = currentUserRole && ['master', 'admin', 'editor'].includes(currentUserRole);
  const canDeleteMedia = currentUserRole && ['master', 'admin'].includes(currentUserRole);

  if (roleLoading || mediaLoading) {
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Gerenciar Mídia</CardTitle>
        {canManageMedia && (
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <UploadCloud className="mr-2 h-4 w-4" /> Enviar Arquivo
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Faça upload, visualize e gerencie arquivos de mídia para sua igreja.
        </p>
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
                    Nenhum arquivo de mídia encontrado.
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

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar Novo Arquivo de Mídia</DialogTitle>
              <DialogDescription>
                Selecione um arquivo do seu computador para fazer upload.
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
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={uploadFileMutation.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleUploadClick} disabled={!fileToUpload || uploadFileMutation.isPending}>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o arquivo "{fileToDelete?.name}"? Esta ação é irreversível.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteFileMutation.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteFileMutation.isPending}>
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
      </CardContent>
    </Card>
  );
};

export default MediaPage;