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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const scheduleMemberFormSchema = z.object({
  member_id: z.string().uuid({ message: 'Membro inválido.' }),
  role: z.string().min(1, { message: 'O papel é obrigatório.' }),
});

type ScheduleMemberFormValues = z.infer<typeof scheduleMemberFormSchema>;

interface ScheduleMemberFormProps {
  scheduleId: string;
  initialData?: {
    id?: string;
    member_id: string;
    role: string;
  };
  onSubmit: (values: ScheduleMemberFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ScheduleMemberForm: React.FC<ScheduleMemberFormProps> = ({
  scheduleId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<ScheduleMemberFormValues>({
    resolver: zodResolver(scheduleMemberFormSchema),
    defaultValues: initialData
      ? {
          member_id: initialData.member_id,
          role: initialData.role,
        }
      : {
          member_id: '',
          role: '',
        },
  });

  const { data: members, isLoading: membersLoading } = useQuery<{ id: string; first_name: string; last_name: string }[], Error>({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membro</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={membersLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Papel na Escala</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Vocalista, Guitarrista, Operador de Som" {...field} />
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

export default ScheduleMemberForm;