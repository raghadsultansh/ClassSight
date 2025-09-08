'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
}

type RagSystem = 'vector' | 'sql';

const questionSuggestions = [
  "What is the average attention score today?",
  "Show me the highest occupancy rooms",
  "Generate a performance report",
  "Which students need extra attention?",
  "How are bootcamps performing this month?",
  "What are the trending metrics?",
];

const ragSystemOptions = [
  { 
    value: 'vector' as RagSystem, 
    label: 'ClassSight AI V1', 
    description: 'Vector-based search through documents and data'
  },
  { 
    value: 'sql' as RagSystem, 
    label: 'ClassSight AI V2', 
    description: 'SQL-based direct database queries'
  }
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRagSystem, setSelectedRagSystem] = useState<RagSystem>('sql');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          conversation_history: messages.slice(-10), // Send last 10 messages for context
          rag_system: selectedRagSystem,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Process sources to extract meaningful strings for display
      const processedSources = (data.sources || []).map((source: any) => {
        if (typeof source === 'string') {
          return source;
        }
        
        if (source.type === 'database_query') {
          return `Database Query (${source.tables_used?.join(', ') || 'multiple tables'})`;
        }
        
        if (source.type === 'document_chunk') {
          return `Document: ${source.metadata?.source || 'Unknown source'}`;
        }
        
        return 'Reference';
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        sender: 'assistant',
        timestamp: new Date(),
        sources: processedSources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-3xl overflow-hidden shadow-lg border border-border">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ClassSight AI
            </h1>
            <p className="text-muted-foreground mt-1">
              Chat with your intelligent classroom analytics assistant
            </p>
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        
        {/* RAG System Selector */}
        <div className="mt-4">
          <Select value={selectedRagSystem} onValueChange={(value: string) => setSelectedRagSystem(value as RagSystem)}>
            <SelectTrigger className="w-80">
              <SelectValue>
                <div className="text-left">
                  <div className="font-medium">
                    {ragSystemOptions.find(opt => opt.value === selectedRagSystem)?.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ragSystemOptions.find(opt => opt.value === selectedRagSystem)?.description}
                  </div>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ragSystemOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="py-2">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Welcome Screen with Suggestions */}
        {showSuggestions && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to ClassSight AI
              </h2>
              <p className="text-muted-foreground mb-8">
                Simply ask your AI chatbot assistant to generate insights from your classroom data!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {questionSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-4 text-left rounded-xl border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <span className="text-primary">?</span>
                      </div>
                      <span className="text-sm font-medium">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <Badge variant="secondary" className="text-xs">
                Powered by ClassSight AI {selectedRagSystem === 'vector' ? 'V1' : 'V2'}
              </Badge>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-1",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {message.sender === 'user' ? 'U' : 'AI'}
                  </div>
                  
                  {/* Message Content */}
                  <div className={cn(
                    "rounded-2xl px-4 py-3 shadow-sm",
                    message.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card text-card-foreground border border-border rounded-tl-sm"
                  )}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium mb-2 opacity-75">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium shrink-0 mt-1">
                    AI
                  </div>
                  <div className="bg-card text-card-foreground border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-6 border-t border-border bg-card">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your classroom data..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
              className="absolute right-2 top-2 h-7 w-7 p-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 3 3 9-3 9 19-9Z" />
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send • Using ClassSight AI {selectedRagSystem === 'vector' ? 'V1' : 'V2'} ({selectedRagSystem === 'vector' ? 'Vector-based' : 'SQL-based'} search)
        </div>
      </div>
    </div>
  );
}
