import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UsersPage: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerenciar Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          Aqui você poderá criar, editar e desativar usuários, além de definir suas roles.
        </p>
      </CardContent>
    </Card>
  );
};

export default UsersPage;