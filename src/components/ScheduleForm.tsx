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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format

const scheduleFormSchema = z.object({
  title: z.string().min(1, { message: 'O título da escala é obrigatório.' }),
  description: z.string().optional(),
  schedule_date: z.date({ required_error: 'A data da escala é obrigatória.' }),
  start_time: z.string().regex(timeRegex, { message: 'Formato de hora inválido (HH:MM).' }).optional().or(z.literal('')),
  end_time: z.string().regex(timeRegex, { message: 'Formato de hora inválido (HH:MM).' }).optional().or(z.literal('')),
  department_id: z.string().uuid({ message: 'Departamento inválido.' }).optional().nullable(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    schedule_date: string; // ISO string from DB
    start_time?: string;
    end_time?: string;
    department_id?: string;
  };
  onSubmit: (values: ScheduleFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description || '',
          schedule_date: new Date(initialData.schedule_date),
          start_time: initialData.start_time || '',
          end_time: initialData.end_time || '',
          department_id: initialData.department_id || null,
        }
      : {
          title: '',
          description: '',
          schedule_date: new Date(),
          start_time: '',
          end_time: '',
          department_id: null,
        },
  });

  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery<{ id: string; name: string }[], Error>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('id, name').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Handle form submission
  const handleSubmit = (values: ScheduleFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Escala</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Louvor - Domingo Manhã" {...field} />
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
                <Textarea
                  placeholder="Detalhes sobre a escala, membros envolvidos, etc."
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
          name="schedule_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Escala</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Início</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Término</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={departmentsLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem> {/* Option for no department */}
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default ScheduleForm;