import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, BookOpen, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

interface BibleVerse {
  verse_number: number;
  text: string;
}

const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { id: 'gen', name: 'Gênesis', testament: 'old', chapters: 50 },
  { id: 'exo', name: 'Êxodo', testament: 'old', chapters: 40 },
  { id: 'lev', name: 'Levítico', testament: 'old', chapters: 27 },
  { id: 'num', name: 'Números', testament: 'old', chapters: 36 },
  { id: 'deu', name: 'Deuteronômio', testament: 'old', chapters: 34 },
  { id: 'jos', name: 'Josué', testament: 'old', chapters: 24 },
  { id: 'jdg', name: 'Juízes', testament: 'old', chapters: 21 },
  { id: 'rut', name: 'Rute', testament: 'old', chapters: 4 },
  { id: '1sa', name: '1 Samuel', testament: 'old', chapters: 31 },
  { id: '2sa', name: '2 Samuel', testament: 'old', chapters: 24 },
  { id: '1ki', name: '1 Reis', testament: 'old', chapters: 22 },
  { id: '2ki', name: '2 Reis', testament: 'old', chapters: 25 },
  { id: '1ch', name: '1 Crônicas', testament: 'old', chapters: 29 },
  { id: '2ch', name: '2 Crônicas', testament: 'old', chapters: 36 },
  { id: 'ezr', name: 'Esdras', testament: 'old', chapters: 10 },
  { id: 'neh', name: 'Neemias', testament: 'old', chapters: 13 },
  { id: 'est', name: 'Ester', testament: 'old', chapters: 10 },
  { id: 'job', name: 'Jó', testament: 'old', chapters: 42 },
  { id: 'psa', name: 'Salmos', testament: 'old', chapters: 150 },
  { id: 'pro', name: 'Provérbios', testament: 'old', chapters: 31 },
  { id: 'ecc', name: 'Eclesiastes', testament: 'old', chapters: 12 },
  { id: 'sng', name: 'Cânticos', testament: 'old', chapters: 8 },
  { id: 'isa', name: 'Isaías', testament: 'old', chapters: 66 },
  { id: 'jer', name: 'Jeremias', testament: 'old', chapters: 52 },
  { id: 'lam', name: 'Lamentações', testament: 'old', chapters: 5 },
  { id: 'ezk', name: 'Ezequiel', testament: 'old', chapters: 48 },
  { id: 'dan', name: 'Daniel', testament: 'old', chapters: 12 },
  { id: 'hos', name: 'Oséias', testament: 'old', chapters: 14 },
  { id: 'jol', name: 'Joel', testament: 'old', chapters: 3 },
  { id: 'amo', name: 'Amós', testament: 'old', chapters: 9 },
  { id: 'oba', name: 'Obadias', testament: 'old', chapters: 1 },
  { id: 'jon', name: 'Jonas', testament: 'old', chapters: 4 },
  { id: 'mic', name: 'Miqueias', testament: 'old', chapters: 7 },
  { id: 'nam', name: 'Naum', testament: 'old', chapters: 3 },
  { id: 'hab', name: 'Habacuque', testament: 'old', chapters: 3 },
  { id: 'zep', name: 'Sofonias', testament: 'old', chapters: 3 },
  { id: 'hag', name: 'Ageu', testament: 'old', chapters: 2 },
  { id: 'zec', name: 'Zacarias', testament: 'old', chapters: 14 },
  { id: 'mal', name: 'Malaquias', testament: 'old', chapters: 4 },
  // New Testament
  { id: 'mat', name: 'Mateus', testament: 'new', chapters: 28 },
  { id: 'mrk', name: 'Marcos', testament: 'new', chapters: 16 },
  { id: 'luk', name: 'Lucas', testament: 'new', chapters: 24 },
  { id: 'jhn', name: 'João', testament: 'new', chapters: 21 },
  { id: 'act', name: 'Atos', testament: 'new', chapters: 28 },
  { id: 'rom', name: 'Romanos', testament: 'new', chapters: 16 },
  { id: '1co', name: '1 Coríntios', testament: 'new', chapters: 16 },
  { id: '2co', name: '2 Coríntios', testament: 'new', chapters: 13 },
  { id: 'gal', name: 'Gálatas', testament: 'new', chapters: 6 },
  { id: 'eph', name: 'Efésios', testament: 'new', chapters: 6 },
  { id: 'php', name: 'Filipenses', testament: 'new', chapters: 4 },
  { id: 'col', name: 'Colossenses', testament: 'new', chapters: 4 },
  { id: '1th', name: '1 Tessalonicenses', testament: 'new', chapters: 5 },
  { id: '2th', name: '2 Tessalonicenses', testament: 'new', chapters: 3 },
  { id: '1ti', name: '1 Timóteo', testament: 'new', chapters: 6 },
  { id: '2ti', name: '2 Timóteo', testament: 'new', chapters: 4 },
  { id: 'tit', name: 'Tito', testament: 'new', chapters: 3 },
  { id: 'phm', name: 'Filemom', testament: 'new', chapters: 1 },
  { id: 'heb', name: 'Hebreus', testament: 'new', chapters: 13 },
  { id: 'jas', name: 'Tiago', testament: 'new', chapters: 5 },
  { id: '1pe', name: '1 Pedro', testament: 'new', chapters: 5 },
  { id: '2pe', name: '2 Pedro', testament: 'new', chapters: 3 },
  { id: '1jn', name: '1 João', testament: 'new', chapters: 5 },
  { id: '2jn', name: '2 João', testament: 'new', chapters: 1 },
  { id: '3jn', name: '3 João', testament: 'new', chapters: 1 },
  { id: 'jud', name: 'Judas', testament: 'new', chapters: 1 },
  { id: 'rev', name: 'Apocalipse', testament: 'new', chapters: 22 },
];

const BiblePage: React.FC = () => {
  const { role: currentUserRole, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterContent, setChapterContent] = useState<BibleVerse[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [readingPlan, setReadingPlan] = useState<any[]>([]);
  const [currentReadingPlanDay, setCurrentReadingPlanDay] = useState<number>(0);

  // Carregar conteúdo do capítulo
  useEffect(() => {
    const fetchChapterContent = async () => {
      setIsLoading(true);
      try {
        // Simulação de conteúdo bíblico (em produção, isso viria de uma API real)
        const mockVerses: BibleVerse[] = Array.from({ length: 30 }, (_, i) => ({
          verse_number: i + 1,
          text: `Este é o versículo ${i + 1} de ${selectedBook.name} ${selectedChapter}. Texto simulado para demonstração.`,
        }));
        setChapterContent(mockVerses);
      } catch (error) {
        console.error('Error fetching chapter content:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o conteúdo do capítulo.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapterContent();
  }, [selectedBook, selectedChapter, toast]);

  // Gerar plano de leitura
  useEffect(() => {
    const generateReadingPlan = () => {
      const plan = [];
      let currentBookIndex = 0;
      let currentChapter = 1;

      // Gerar plano de 30 dias
      for (let day = 1; day <= 30; day++) {
        const book = BIBLE_BOOKS[currentBookIndex];
        if (currentChapter > book.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
        if (currentBookIndex >= BIBLE_BOOKS.length) break;

        plan.push({
          day,
          book: BIBLE_BOOKS[currentBookIndex].name,
          chapter: currentChapter,
          reference: `${BIBLE_BOOKS[currentBookIndex].name} ${currentChapter}`,
        });
        currentChapter++;
      }
      setReadingPlan(plan);
    };

    generateReadingPlan();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Simulação de busca (em produção, isso viria de uma API real)
      const mockResults = [
        {
          reference: 'João 3:16',
          text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
          book: 'João',
          chapter: 3,
          verse: 16,
        },
        {
          reference: 'Salmos 23:1',
          text: 'O Senhor é o meu pastor; nada me faltará.',
          book: 'Salmos',
          chapter: 23,
          verse: 1,
        },
        {
          reference: 'Filipenses 4:13',
          text: 'Posso todas as coisas naquele que me fortalece.',
          book: 'Filipenses',
          chapter: 4,
          verse: 13,
        },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching Bible:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a busca.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToReference = (bookName: string, chapter: number) => {
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const goToPreviousChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Ir para o livro anterior
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (currentIndex > 0) {
        setSelectedBook(BIBLE_BOOKS[currentIndex - 1]);
        setSelectedChapter(BIBLE_BOOKS[currentIndex - 1].chapters);
      }
    }
  };

  const goToNextChapter = () => {
    const currentBook = BIBLE_BOOKS.find(b => b.id === selectedBook.id);
    if (currentBook && selectedChapter < currentBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Ir para o próximo livro
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        setSelectedBook(BIBLE_BOOKS[currentIndex + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const goToPreviousReadingDay = () => {
    if (currentReadingPlanDay > 0) {
      setCurrentReadingPlanDay(currentReadingPlanDay - 1);
    }
  };

  const goToNextReadingDay = () => {
    if (currentReadingPlanDay < readingPlan.length - 1) {
      setCurrentReadingPlanDay(currentReadingPlanDay + 1);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUserRole !== 'master' && currentUserRole !== 'admin' && currentUserRole !== 'editor' && currentUserRole !== 'member') {
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
    <div className="space-y-6">
      {/* Navegação e Leitura Bíblica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Leitura Bíblica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="book-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Livro
                </label>
                <Select 
                  value={selectedBook.id} 
                  onValueChange={(value) => {
                    const book = BIBLE_BOOKS.find(b => b.id === value);
                    if (book) setSelectedBook(book);
                  }}
                >
                  <SelectTrigger id="book-select" className="w-full">
                    <SelectValue placeholder="Selecione um livro" />
                  </SelectTrigger>
                  <SelectContent>
                    <optgroup label="Antigo Testamento">
                      {BIBLE_BOOKS.filter(b => b.testament === 'old').map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label="Novo Testamento">
                      {BIBLE_BOOKS.filter(b => b.testament === 'new').map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label htmlFor="chapter-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Capítulo
                </label>
                <Select 
                  value={selectedChapter.toString()} 
                  onValueChange={(value) => setSelectedChapter(parseInt(value))}
                >
                  <SelectTrigger id="chapter-select" className="w-full">
                    <SelectValue placeholder="Capítulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <SelectItem key={chapter} value={chapter.toString()}>
                        Capítulo {chapter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={goToPreviousChapter} 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={goToNextChapter} 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : chapterContent ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                  {selectedBook.name} {selectedChapter}
                </h3>
                <div className="space-y-3 text-justify">
                  {chapterContent.map((verse) => (
                    <p key={verse.verse_number} className="text-sm">
                      <sup className="text-primary font-medium">{verse.verse_number}</sup> {verse.text}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Nenhum conteúdo disponível para este capítulo.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Busca Bíblica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Search className="h-5 w-5" /> Busca Bíblica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar versículos, palavras-chave, referências..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Buscar
                  </>
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Resultados da busca:</h4>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index} 
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigateToReference(result.book, result.chapter)}
                    >
                      <p className="font-medium text-primary">{result.reference}</p>
                      <p className="text-sm mt-1">{result.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plano de Leitura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Plano de Leitura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Plano de Leitura de 30 Dias</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={goToPreviousReadingDay} 
                  variant="outline" 
                  size="icon" 
                  disabled={currentReadingPlanDay === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  Dia {currentReadingPlanDay + 1} de {readingPlan.length}
                </span>
                <Button 
                  onClick={goToNextReadingDay} 
                  variant="outline" 
                  size="icon" 
                  disabled={currentReadingPlanDay === readingPlan.length - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {readingPlan.length > 0 && (
              <div className="space-y-2">
                <div 
                  className="p-4 border rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    const reading = readingPlan[currentReadingPlanDay];
                    navigateToReference(reading.book, reading.chapter);
                  }}
                >
                  <h5 className="font-medium">Leitura do Dia {currentReadingPlanDay + 1}</h5>
                  <p className="text-primary font-medium">
                    {readingPlan[currentReadingPlanDay].reference}
                  </p>
                </div>
                <div className="space-y-1">
                  <h5 className="font-medium">Próximas leituras:</h5>
                  {readingPlan.slice(currentReadingPlanDay + 1, currentReadingPlanDay + 6).map((day, index) => (
                    <div 
                      key={index} 
                      className="p-2 text-sm hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => {
                        setCurrentReadingPlanDay(currentReadingPlanDay + index + 1);
                        navigateToReference(day.book, day.chapter);
                      }}
                    >
                      Dia {day.day}: {day.reference}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiblePage;