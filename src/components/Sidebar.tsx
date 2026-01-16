import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserCog,
  Briefcase,
  Calendar,
  Image,
  Settings,
  LogOut,
  Menu,
  BookOpenText,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[]; // Roles that can see this item
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Users, roles: ['master', 'admin', 'leader', 'editor', 'member'] },
  { href: "/admin/users", label: "Usuários", icon: UserCog, roles: ['master', 'admin'] },
  { href: "/admin/members", label: "Membros", icon: Users, roles: ['master', 'admin', 'leader', 'editor'] },
  { href: "/admin/departments", label: "Departamentos", icon: Briefcase, roles: ['master', 'admin', 'leader'] },
  { href: "/admin/schedules", label: "Escalas", icon: Calendar, roles: ['master', 'admin', 'leader', 'editor'] },
  { href: "/admin/events", label: "Eventos", icon: Calendar, roles: ['master', 'admin', 'editor'] },
  { href: "/admin/media", label: "Mídia", icon: Image, roles: ['master', 'admin', 'editor'] },
  { href: "/admin/galleries", label: "Galerias", icon: Image, roles: ['master', 'admin', 'editor'] },
  { href: "/admin/bible", label: "Bíblia", icon: BookOpenText, roles: ['master', 'admin', 'editor'] },
  { href: "/admin/settings", label: "Configurações", icon: Settings, roles: ['master', 'admin'] },
];

const Sidebar: React.FC<{ churchName: string }> = ({ churchName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { role, isLoading: roleLoading } = useUserRole();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Sidebar] Logout error:", error.message);
      toast.error("Failed to log out: " + error.message);
    } else {
      navigate('/login');
    }
  };

  const renderNavItems = () => (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        // Only render if the user's role is allowed for this item
        if (roleLoading || !role || (item.roles && !item.roles.includes(role))) {
          return null;
        }
        const isActive = location.pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              isActive
                ? "bg-muted text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <Button
        onClick={handleLogout}
        variant="ghost"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mt-4"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <Link to="/admin" className="flex items-center gap-2 text-lg font-semibold mb-4">
            <span className="text-xl font-bold">{churchName || "Admin"}</span>
          </Link>
          {renderNavItems()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold">{churchName || "Admin"}</span>
          </Link>
        </div>
        <div className="flex-1">
          {renderNavItems()}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;