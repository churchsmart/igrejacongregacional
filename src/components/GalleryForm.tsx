import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const galleryFormSchema = z.object({
  title: z.string().min(1, { message: 'O título da galeria é obrigatório.' }),
});

type GalleryFormValues = z.infer<typeof galleryFormSchema>;

interface GalleryFormProps {
  initialData?: {
    id?: string;
    title: string;
  };
  onSubmit: (values: GalleryFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const GalleryForm: React.FC<GalleryFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
        }
      : {
          title: '',
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
              <FormLabel>Título da Galeria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Evento de Natal 2023" {...field} />
              </FormControl>
              <FormMessage />
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

export default GalleryForm;