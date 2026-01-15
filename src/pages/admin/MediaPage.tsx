import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MediaPage: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerenciar Mídia</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          Galerias de fotos e upload múltiplo de imagens para o Supabase Storage.
        </p>
      </CardContent>
    </Card>
  );
};

export default MediaPage;