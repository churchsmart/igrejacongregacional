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
import { Textarea } from '@/components/ui/textarea';

const churchSettingsFormSchema = z.object({
  church_name: z.string().min(1, { message: 'O nome da igreja é obrigatório.' }),
  logo_url: z.string().url({ message: 'URL do logo inválida.' }).optional().or(z.literal('')),
  description: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email({ message: 'Email de contato inválido.' }).optional().or(z.literal('')),
});

type ChurchSettingsFormValues = z.infer<typeof churchSettingsFormSchema>;

interface ChurchSettingsFormProps {
  initialData?: {
    church_name: string;
    logo_url?: string;
    description?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  onSubmit: (values: ChurchSettingsFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ChurchSettingsForm: React.FC<ChurchSettingsFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<ChurchSettingsFormValues>({
    resolver: zodResolver(churchSettingsFormSchema),
    defaultValues: initialData
      ? {
          church_name: initialData.church_name,
          logo_url: initialData.logo_url || '',
          description: initialData.description || '',
          contact_phone: initialData.contact_phone || '',
          contact_email: initialData.contact_email || '',
        }
      : {
          church_name: '',
          logo_url: '',
          description: '',
          contact_phone: '',
          contact_email: '',
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="church_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Igreja</FormLabel>
              <FormControl>
                <Input placeholder="Nome da sua igreja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Logo</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Uma breve descrição sobre a igreja." className="resize-y" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone de Contato</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de Contato</FormLabel>
              <FormControl>
                <Input placeholder="contato@suaigreja.com" {...field} />
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

export default ChurchSettingsForm;