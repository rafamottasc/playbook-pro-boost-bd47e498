import React, { useState } from "react";
import { Building2, Phone, Mail, ExternalLink, FileText, Edit, Trash2, User, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  partner_files?: PartnerFile[];
  partner_links?: PartnerLink[];
}

interface PartnerCardProps {
  partner: Partner;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PartnerCard({ partner, isAdmin, onEdit, onDelete }: PartnerCardProps) {
  const files = partner.partner_files || [];
  const links = partner.partner_links || [];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="hover:shadow-lg transition-shadow">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{partner.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={partner.active ? "default" : "secondary"}>
                  {partner.active ? "Ativa" : "Inativa"}
                </Badge>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "transform rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {partner.manager_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{partner.manager_name}</span>
              </div>
            )}

        {(partner.manager_phone || partner.manager_email) && (
          <div className="space-y-2">
            {partner.manager_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${partner.manager_phone}`} className="hover:underline">
                  {partner.manager_phone}
                </a>
              </div>
            )}
            {partner.manager_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${partner.manager_email}`} className="hover:underline">
                  {partner.manager_email}
                </a>
              </div>
            )}
          </div>
        )}

        {partner.observations && (
          <div>
            <p className="text-sm font-medium mb-1">Observações:</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{partner.observations}</p>
          </div>
        )}

        {(files.length > 0 || links.length > 0 || partner.drive_link) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Materiais:</p>
              <div className="space-y-1">
                {partner.drive_link && (
                  <a
                    href={partner.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Google Drive
                  </a>
                )}
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    {file.file_name}
                  </a>
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
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
