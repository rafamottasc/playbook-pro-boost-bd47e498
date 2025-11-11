import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";
import { useAuth } from "@/hooks/useAuth";

export function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Não mostrar em rotas de auth ou pending approval
  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 transition-all duration-300 animate-fade-in hover:scale-110"
        aria-label="Enviar feedback"
      >
        <MessageSquare size={22} />
      </button>
      
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
