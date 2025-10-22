import React, { useState } from "react";
import { Building2, Phone, Mail, ExternalLink, FileText, Edit, Trash2, User, ChevronDown, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatPhone } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PartnerFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface PartnerLink {
  id: string;
  title: string;
  url: string;
  link_type: string;
}

interface Partner {
  id: string;
  name: string;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  observations: string | null;
  active: boolean;
  drive_link: string | null;
  cidade: string | null;
  frente_mar: boolean | null;
  prioritaria: boolean | null;
  partner_files?: PartnerFile[];
  partner_links?: PartnerLink[];
}

interface PartnerCardProps {
  partner: Partner;
  isAdmin?: boolean;
  isPrioritaria?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PartnerCard({ partner, isAdmin, isPrioritaria, onEdit, onDelete }: PartnerCardProps) {
  const files = partner.partner_files || [];
  const links = partner.partner_links || [];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn(
        "hover:shadow-lg transition-shadow",
        isPrioritaria && "border-l-4 border-l-primary"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    {isPrioritaria && (
                      <Badge variant="default" className="bg-primary/10 text-primary border-primary text-xs">
                        ⭐ Prioritária
                      </Badge>
                    )}
                  </div>
                  {partner.cidade && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.cidade}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {partner.frente_mar && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    🌊 Frente Mar
                  </Badge>
                )}
                <Badge variant={partner.active ? "default" : "secondary"}>
                  {partner.active ? "Ativa" : "Inativa"}
                </Badge>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {partner.manager_name && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Gerente</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.manager_name}</span>
                </div>
              </div>
            )}

            {partner.manager_phone && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${partner.manager_phone}`} className="text-sm hover:underline">
                    {formatPhone(partner.manager_phone)}
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      const phoneNumber = partner.manager_phone?.replace(/\D/g, '');
                      window.open(`https://wa.me/55${phoneNumber}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {partner.manager_email && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${partner.manager_email}`} className="hover:underline">
                    {partner.manager_email}
                  </a>
                </div>
              </div>
            )}

            {partner.observations && (
              <div>
                <p className="text-sm font-medium mb-1">Observações:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{partner.observations}</p>
              </div>
            )}

            {(files.length > 0 || links.length > 0) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Materiais:</p>
                  <div className="space-y-1">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="text-sm truncate">{file.file_name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            aria-label={`Visualizar ${file.file_name}`}
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(file.file_url, '_blank');
                            }}
                          >
                            👁️ Ver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-7 px-2"
                            aria-label={`Baixar ${file.file_name}`}
                            asChild
                          >
                            <a href={file.file_url} download={file.file_name}>
                              ⬇️ Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isAdmin && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={onEdit} aria-label={`Editar parceria ${partner.name}`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete} aria-label={`Excluir parceria ${partner.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}