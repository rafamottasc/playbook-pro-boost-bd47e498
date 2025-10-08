import React from "react";
import { PartnerCard } from "./PartnerCard";

interface Partner {
  id: string;
  name: string;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  observations: string | null;
  active: boolean;
  drive_link: string | null;
  partner_files?: any[];
  partner_links?: any[];
}

interface CategorySectionProps {
  categoryName: string;
  partners: Partner[];
  isAdmin?: boolean;
  onEditPartner?: (partner: Partner) => void;
  onDeletePartner?: (partnerId: string) => void;
}

export function CategorySection({
  categoryName,
  partners,
  isAdmin,
  onEditPartner,
  onDeletePartner,
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{categoryName}</h2>
        <p className="text-sm text-muted-foreground">
          {partners.length} {partners.length === 1 ? "construtora" : "construtoras"}
        </p>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhuma construtora nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              isAdmin={isAdmin}
              onEdit={() => onEditPartner?.(partner)}
              onDelete={() => onDeletePartner?.(partner.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
