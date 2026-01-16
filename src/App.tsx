import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionContextProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardContent from "./pages/admin/DashboardContent";
import UsersPage from "./pages/admin/UsersPage";
import MembersPage from "./pages/admin/MembersPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import SchedulesPage from "./pages/admin/SchedulesPage";
import EventsPage from "./pages/admin/EventsPage";
import MediaPage from "./pages/admin/MediaPage";
import GalleriesPage from "./pages/admin/GalleriesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import BiblePage from "./pages/admin/BiblePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardContent />} />
              <Route path="dashboard" element={<AdminDashboardContent />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="galleries" element={<GalleriesPage />} />
              <Route path="bible" element={<BiblePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;