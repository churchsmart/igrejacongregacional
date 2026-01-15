import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SchedulesPage: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerenciar Escalas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          Criação e gerenciamento de escalas de louvor e ministérios.
        </p>
      </CardContent>
    </Card>
  );
};

export default SchedulesPage;