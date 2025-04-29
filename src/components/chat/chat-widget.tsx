'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  onClose: () => void;
}

export function ChatWidget({ onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente do Robo-ETF. Como posso ajudar você com informações sobre ETFs hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Enviar mensagem para a API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta');
      }

      const data = await response.json();

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua pergunta. Tente novamente.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Mensagem de fallback em caso de erro
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua pergunta. ETFs são fundos negociados em bolsa que permitem investir em cestas de ativos como ações e títulos. Posso tentar responder perguntas básicas sobre ETFs mesmo offline.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="fixed bottom-20 right-6 w-80 md:w-96 h-96 shadow-xl z-40 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Assistente ETF</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">×</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    {message.role === 'assistant' ? (
                      <AvatarImage src="/robot-avatar.png" alt="AI" />
                    ) : (
                      <AvatarImage src="/user-avatar.png" alt="User" />
                    )}
                    <AvatarFallback>
                      {message.role === 'assistant' ? 'AI' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`rounded-lg p-3 text-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Digite sua pergunta sobre ETFs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !input.trim()}
            size="icon"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "→"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
