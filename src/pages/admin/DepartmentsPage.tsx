import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DepartmentsPage: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerenciar Departamentos / Ministérios</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          CRUD completo de departamentos e vinculação de membros.
        </p>
      </CardContent>
    </Card>
  );
};

export default DepartmentsPage;