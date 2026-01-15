import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

const BiblePage: React.FC = () => {
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAccessBible = currentUserRole && ['master', 'admin', 'editor', 'member'].includes(currentUserRole);

  if (!canAccessBible) {
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
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bíblia</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Esta seção será dedicada à navegação e estudo da Bíblia.
        </p>
        <p className="text-gray-500 dark:text-gray-300">
          Funcionalidades como busca de versículos, leitura por livro/capítulo e anotações podem ser adicionadas aqui.
        </p>
      </CardContent>
    </Card>
  );
};

export default BiblePage;