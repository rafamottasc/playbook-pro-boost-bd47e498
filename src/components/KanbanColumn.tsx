import React from "react";
import { MessageCard } from "./MessageCard";

interface Message {
  id: string;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
  delivery_type?: 'audio' | 'call' | 'text';
}

interface KanbanColumnProps {
  stage: string;
  messages: Message[];
  userFeedbacks: Record<string, 'like' | 'dislike'>;
  onMessageCopy: (messageId: string) => void;
  onMessageLike: (messageId: string) => void;
  onMessageDislike: (messageId: string) => void;
  onMessageSuggest: (messageId: string, suggestion: string) => void;
}

export function KanbanColumn({
  stage,
  messages,
  userFeedbacks,
  onMessageCopy,
  onMessageLike,
  onMessageDislike,
  onMessageSuggest,
}: KanbanColumnProps) {
  return (
    <div className="flex w-full flex-col">
      {/* Column Header */}
      <div className="mb-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-primary">{stage}</h3>
          <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold shadow-sm">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 flex-1">
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            id={message.id}
            title={message.title}
            content={message.content}
            likes={message.likes}
            dislikes={message.dislikes}
            userFeedback={userFeedbacks[message.id] || null}
            deliveryType={message.delivery_type}
            onCopy={() => onMessageCopy(message.id)}
            onLike={() => onMessageLike(message.id)}
            onDislike={() => onMessageDislike(message.id)}
            onSuggest={(suggestion) => onMessageSuggest(message.id, suggestion)}
          />
        ))}
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
