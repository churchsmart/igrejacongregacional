import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Briefcase, Calendar, Megaphone } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const AdminDashboardContent: React.FC = () => {
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboardMembersCount'],
        queryFn: async () => {
          const { count, error } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });
          if (error) throw new Error(error.message);
          return count;
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor'),
      },
      {
        queryKey: ['dashboardDepartmentsCount'],
        queryFn: async () => {
          const { count, error } = await supabase
            .from('departments')
            .select('*', { count: 'exact', head: true });
          if (error) throw new Error(error.message);
          return count;
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader'),
      },
      {
        queryKey: ['dashboardSchedulesCount'],
        queryFn: async () => {
          const { count, error } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true });
          if (error) throw new Error(error.message);
          return count;
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor' || currentUserRole === 'member'),
      },
      {
        queryKey: ['dashboardEventsCount'],
        queryFn: async () => {
          const { count, error } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });
          if (error) throw new Error(error.message);
          return count;
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
      },
      {
        queryKey: ['upcomingEvents'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('events')
            .select('id, title, event_date, start_time')
            .gte('event_date', format(new Date(), 'yyyy-MM-dd'))
            .order('event_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(3);
          if (error) throw new Error(error.message);
          return data;
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'editor' || currentUserRole === 'member'),
      },
      {
        queryKey: ['recentSchedules'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('schedules')
            .select('id, title, schedule_date, start_time, departments(name)')
            .gte('schedule_date', format(new Date(), 'yyyy-MM-dd'))
            .order('schedule_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(3);
          if (error) throw new Error(error.message);
          return data.map(schedule => ({
            ...schedule,
            department_name: (schedule as any).departments?.name || 'N/A',
          }));
        },
        enabled: !roleLoading && (currentUserRole === 'master' || currentUserRole === 'admin' || currentUserRole === 'leader' || currentUserRole === 'editor' || currentUserRole === 'member'),
      },
    ],
  });

  const [
    membersCountQuery,
    departmentsCountQuery,
    schedulesCountQuery,
    eventsCountQuery,
    upcomingEventsQuery,
    recentSchedulesQuery,
  ] = results;

  const isLoading = roleLoading || results.some(query => query.isLoading);
  const isError = results.some(query => query.isError);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-500">Erro ao carregar dados do dashboard.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{membersCountQuery.data ?? 0}</div>
          <p className="text-xs text-muted-foreground">Membros ativos na igreja</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Departamentos</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{departmentsCountQuery.data ?? 0}</div>
          <p className="text-xs text-muted-foreground">Departamentos e ministérios</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Escalas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{schedulesCountQuery.data ?? 0}</div>
          <p className="text-xs text-muted-foreground">Escalas planejadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventsCountQuery.data ?? 0}</div>
          <p className="text-xs text-muted-foreground">Eventos anunciados</p>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEventsQuery.data && upcomingEventsQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {upcomingEventsQuery.data.map((event: any) => (
                <li key={event.id} className="flex justify-between items-center">
                  <Link to={`/admin/events?edit=${event.id}`} className="font-medium hover:underline">
                    {event.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), 'dd/MM/yyyy')} {event.start_time}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhum evento próximo.</p>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Próximas Escalas</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSchedulesQuery.data && recentSchedulesQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {recentSchedulesQuery.data.map((schedule: any) => (
                <li key={schedule.id} className="flex justify-between items-center">
                  <Link to={`/admin/schedules?edit=${schedule.id}`} className="font-medium hover:underline">
                    {schedule.title} ({schedule.department_name})
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(schedule.schedule_date), 'dd/MM/yyyy')} {schedule.start_time}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhuma escala próxima.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardContent;