import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import UsersPage from './admin/UsersPage';
import MembersPage from './admin/MembersPage';
import DepartmentsPage from './admin/DepartmentsPage';
import SchedulesPage from './admin/SchedulesPage';
import EventsPage from './admin/EventsPage';
import MediaPage from './admin/MediaPage';
import SettingsPage from './admin/SettingsPage';
import BiblePage from './admin/BiblePage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChurchSettings } from '@/hooks/useChurchSettings';
import { Loader2 } from 'lucide-react';

const AdminDashboardContent: React.FC = () => {
  const { settings, isLoading } = useChurchSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full text-center">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          Bem-vindo ao Painel de Administração {settings?.church_name ? `da ${settings.church_name}` : ''}!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Use o menu lateral para navegar pelas funcionalidades.
        </p>
      </CardContent>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboardContent />} />
        <Route path="dashboard" element={<AdminDashboardContent />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="bible" element={<BiblePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} /> {/* Catch-all for admin sub-routes */}
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;