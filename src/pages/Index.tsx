import { MadeWithDyad } from "@/components/made-with-dyad";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { settings, isLoading, error } = useChurchSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-red-500">Erro ao carregar informações da igreja: {error.message}</p>
      </div>
    );
  }

  const churchName = settings?.church_name || "Sua Igreja";
  const churchDescription = settings?.description || "Bem-vindo à nossa comunidade!";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">{churchName}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {churchDescription}
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;