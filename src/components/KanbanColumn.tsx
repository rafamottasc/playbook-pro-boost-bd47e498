import React from "react";
import { MessageCard } from "./MessageCard";

interface Message {
  id: string;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
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
      <div className="mb-4 rounded-lg border bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">{stage}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
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
