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
  const churchLogo = settings?.logo_url || "/placeholder.svg";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Church Logo */}
        <div className="mb-8">
          <img
            src={churchLogo}
            alt={`${churchName} Logo`}
            className="mx-auto h-32 w-32 rounded-full object-cover border-4 border-primary"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </div>

        {/* Church Name */}
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">{churchName}</h1>

        {/* Church Description */}
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {churchDescription}
        </p>

        {/* Welcome Message */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Bem-vindo à nossa igreja!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Somos uma comunidade dedicada a servir a Deus e ao próximo. Junte-se a nós para cultos, estudos bíblicos e eventos especiais.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Se você é novo por aqui, ficaremos felizes em conhecê-lo e ajudá-lo a se sentir em casa.
          </p>
        </div>

        {/* Quick Access for Members */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Acesso Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/bible"
              className="bg-primary text-primary-foreground rounded-lg p-4 text-center hover:bg-primary/90 transition-colors"
            >
              <div className="text-2xl mb-2">📖</div>
              <div className="font-medium">Leitura Bíblica</div>
            </a>
            <a
              href="/admin/events"
              className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center hover:bg-secondary/90 transition-colors"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="font-medium">Eventos</div>
            </a>
          </div>
        </div>

        {/* Contact Information */}
        {settings?.contact_email && (
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Entre em contato: {settings.contact_email}</p>
            {settings.contact_phone && <p>Telefone: {settings.contact_phone}</p>}
          </div>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;