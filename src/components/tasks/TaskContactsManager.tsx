import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Phone, MessageCircle, MapPin } from "lucide-react";
import type { TaskContact } from "@/hooks/useTasks";

interface TaskContactsManagerProps {
  contacts: TaskContact[];
  onChange: (contacts: TaskContact[]) => void;
  readonly?: boolean;
}

export function TaskContactsManager({ contacts, onChange, readonly = false }: TaskContactsManagerProps) {
  const [newContact, setNewContact] = useState({ name: '', phone: '', address: '' });

  const handleAdd = () => {
    if (!newContact.name.trim()) return;

    const contact: TaskContact = {
      id: crypto.randomUUID(),
      task_id: '',
      name: newContact.name.trim(),
      phone: newContact.phone.trim() || undefined,
      address: newContact.address.trim() || undefined,
    };

    onChange([...contacts, contact]);
    setNewContact({ name: '', phone: '', address: '' });
  };

  const handleRemove = (id: string) => {
    onChange(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Lista de contatos */}
      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{contact.name}</p>
                {!readonly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(contact.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {readonly && (
                <div className="flex flex-wrap gap-2">
                  {contact.phone && (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${contact.phone}`}>
                          <Phone className="w-3 h-3 mr-1" />
                          Ligar
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </a>
                      </Button>
                    </>
                  )}
                  {contact.address && (
                    <Button size="sm" variant="outline" asChild>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Ver no mapa
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {!readonly && (
                <>
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {contact.phone}
                    </p>
                  )}
                  {contact.address && (
                    <p className="text-sm text-muted-foreground">
                      📍 {contact.address}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar contato */}
      {!readonly && (
        <div className="space-y-3 p-3 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Nome *</Label>
            <Input
              id="contact-name"
              placeholder="Nome do contato"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Telefone</Label>
            <Input
              id="contact-phone"
              placeholder="(00) 00000-0000"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-address">Endereço</Label>
            <Input
              id="contact-address"
              placeholder="Rua, número, bairro"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={!newContact.name.trim()}
            className="w-full"
          >
            Adicionar Contato
          </Button>
        </div>
      )}

      {contacts.length === 0 && readonly && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum contato adicionado
        </p>
      )}
    </div>
  );
}
