import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const newsFormSchema = z.object({
  title: z.string().min(1, { message: 'O título é obrigatório.' }),
  content: z.string().optional(),
  image_url: z.string().url({ message: 'URL da imagem inválida.' }).optional().or(z.literal('')),
  is_important: z.boolean().default(false),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

interface NewsFormProps {
  initialData?: {
    id?: string;
    title: string;
    content?: string;
    image_url?: string;
    is_important: boolean;
  };
  onSubmit: (values: NewsFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const NewsForm: React.FC<NewsFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      content: initialData.content || '',
      image_url: initialData.image_url || '',
      is_important: initialData.is_important || false,
    } : {
      title: '',
      content: '',
      image_url: '',
      is_important: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título da notícia ou aviso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalhes da notícia ou aviso" 
                  className="resize-y" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/imagem.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_important"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Notícia Importante</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se esta notícia é de alta importância
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewsForm;