import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building, Building2, Users, ExternalLink, Pencil, Trash2, User, Globe, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, BRAZILIAN_STATES, getCountryFlag, getStateName } from "@/lib/locations";

interface Campaign {
  id: string;
  construtora: string;
  empreendimento: string;
  link_anuncio: string | null;
  status: string;
  created_at: string;
  countries: string[];
  states: string[];
  campaign_participants?: Array<{
    user_id: string;
    profiles: {
      full_name: string;
    };
  }>;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function Campaigns() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Form states for campaign creation/editing
  const [construtora, setConstrutora] = useState("");
  const [empreendimento, setEmpreendimento] = useState("");
  const [linkAnuncio, setLinkAnuncio] = useState("");
  const [status, setStatus] = useState("ativa");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  useEffect(() => {
    console.log('Campaigns Effect - Auth States:', { 
      hasUser: !!user, 
      userId: user?.id,
      isAdmin, 
      authLoading, 
      loading 
    });

    // Só tenta carregar quando a auth terminou de verificar
    if (!authLoading) {
      if (user) {
        console.log('User authenticated, fetching campaigns...');
        fetchCampaigns();
        // Fetch profiles for all users (needed to show participant selection)
        if (isAdmin) {
          console.log('User is admin, fetching profiles...');
          fetchProfiles();
        }
      } else {
        // Se não tem user após auth carregar, mostrar página vazia
        console.log('No user after auth loaded, setting loading to false');
        setLoading(false);
      }
    }
  }, [user, isAdmin, authLoading]);

  const fetchCampaigns = async () => {
    try {
      console.log("Fetching campaigns...");
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          campaign_participants (
            user_id,
            profiles (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Campaign fetch error:", error);
        throw error;
      }
      
      console.log("Campaigns fetched:", data);
      
      // Sort campaigns by status: ativa -> pausada -> encerrada
      const sortedData = (data || []).sort((a, b) => {
        const statusOrder = { ativa: 0, pausada: 1, encerrada: 2 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      });
      
      setCampaigns(sortedData);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Erro ao carregar campanhas",
        description: "Não foi possível carregar as campanhas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.rpc("get_public_profiles");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleSubmit = async () => {
    if (!construtora || !empreendimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha construtora e empreendimento.",
        variant: "destructive",
      });
      return;
    }

    console.log("Selected participants:", selectedParticipants);

    try {
      if (editingCampaign) {
        // Update campaign
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            construtora,
            empreendimento,
            link_anuncio: linkAnuncio || null,
            status,
            countries: selectedCountries,
            states: selectedStates,
          })
          .eq("id", editingCampaign.id);

        if (updateError) {
          console.error("Update campaign error:", updateError);
          throw updateError;
        }

        // Delete old participants
        const { error: deleteError } = await supabase
          .from("campaign_participants")
          .delete()
          .eq("campaign_id", editingCampaign.id);

        if (deleteError) {
          console.error("Delete participants error:", deleteError);
          throw deleteError;
        }

        // Insert new participants
        if (selectedParticipants.length > 0) {
          const participants = selectedParticipants.map((userId) => ({
            campaign_id: editingCampaign.id,
            user_id: userId,
          }));

          console.log("Inserting participants (update):", participants);

          const { data: insertData, error: insertError } = await supabase
            .from("campaign_participants")
            .insert(participants)
            .select();

          console.log("Insert result (update):", { insertData, insertError });

          if (insertError) {
            console.error("Insert participants error:", insertError);
            throw insertError;
          }
        }

        toast({
          title: "Campanha atualizada",
          description: "A campanha foi atualizada com sucesso.",
        });
      } else {
        // Create campaign
        const { data: newCampaign, error: campaignError } = await supabase
          .from("campaigns")
          .insert({
            construtora,
            empreendimento,
            link_anuncio: linkAnuncio || null,
            status,
            countries: selectedCountries,
            states: selectedStates,
          })
          .select()
          .single();

        if (campaignError) {
          console.error("Create campaign error:", campaignError);
          throw campaignError;
        }

        console.log("New campaign created:", newCampaign);

        // Insert participants
        if (selectedParticipants.length > 0) {
          const participants = selectedParticipants.map((userId) => ({
            campaign_id: newCampaign.id,
            user_id: userId,
          }));

          console.log("Inserting participants (create):", participants);

          const { data: insertData, error: participantsError } = await supabase
            .from("campaign_participants")
            .insert(participants)
            .select();

          console.log("Insert result (create):", { insertData, participantsError });

          if (participantsError) {
            console.error("Insert participants error:", participantsError);
            throw participantsError;
          }
        } else {
          console.log("No participants selected to insert");
        }

        toast({
          title: "Campanha criada",
          description: "A campanha foi criada com sucesso.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Erro ao salvar campanha",
        description: "Não foi possível salvar a campanha.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Erro ao excluir campanha",
        description: "Não foi possível excluir a campanha.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setConstrutora(campaign.construtora);
    setEmpreendimento(campaign.empreendimento);
    setLinkAnuncio(campaign.link_anuncio || "");
    setStatus(campaign.status);
    setSelectedCountries(campaign.countries || []);
    setSelectedStates(campaign.states || []);
    setSelectedParticipants(
      campaign.campaign_participants?.map((p) => p.user_id) || []
    );
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setConstrutora("");
    setEmpreendimento("");
    setLinkAnuncio("");
    setStatus("ativa");
    setSelectedParticipants([]);
    setSelectedCountries([]);
    setSelectedStates([]);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries((prev) =>
      prev.includes(countryCode)
        ? prev.filter((code) => code !== countryCode)
        : [...prev, countryCode]
    );
    // If deselecting Brazil, clear states
    if (countryCode === "BR" && selectedCountries.includes("BR")) {
      setSelectedStates([]);
    }
  };

  const toggleState = (stateCode: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateCode)
        ? prev.filter((code) => code !== stateCode)
        : [...prev, stateCode]
    );
  };

  const renderLocationInfo = (campaign: Campaign) => {
    const countries = campaign.countries || [];
    const states = campaign.states || [];
    
    if (countries.length === 0 && states.length === 0) {
      return null;
    }

    return (
      <div className="text-xs text-muted-foreground mt-1">
        {countries.length > 0 && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {countries.map(code => getCountryFlag(code)).join(" ")}
            {countries.length > 3 && ` +${countries.length - 3}`}
          </span>
        )}
        {states.length > 0 && (
          <span className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {states.slice(0, 3).map(code => getStateName(code)).join(", ")}
            {states.length > 3 && ` +${states.length - 3}`}
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativa: { label: "Ativa", className: "bg-green-500 hover:bg-green-600" },
      pausada: { label: "Pausada", className: "bg-orange-500 hover:bg-orange-600" },
      encerrada: { label: "Encerrada", className: "bg-red-500 hover:bg-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativa;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const uniqueConstrutoras = Array.from(new Set(campaigns.map((c) => c.construtora)));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Campanhas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie campanhas por construtora e empreendimento
              </p>
            </div>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCampaign ? "Editar Campanha" : "Nova Campanha"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="construtora">Construtora *</Label>
                      <Input
                        id="construtora"
                        value={construtora}
                        onChange={(e) => setConstrutora(e.target.value)}
                        placeholder="Ex: Caleone"
                        list="construtoras"
                      />
                      <datalist id="construtoras">
                        {uniqueConstrutoras.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="empreendimento">Empreendimento *</Label>
                      <Input
                        id="empreendimento"
                        value={empreendimento}
                        onChange={(e) => setEmpreendimento(e.target.value)}
                        placeholder="Ex: Minuanno"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link">Link do Anúncio</Label>
                      <Input
                        id="link"
                        value={linkAnuncio}
                        onChange={(e) => setLinkAnuncio(e.target.value)}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">🟢 Ativa</SelectItem>
                          <SelectItem value="pausada">🟠 Pausada</SelectItem>
                          <SelectItem value="encerrada">🔴 Encerrada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>🌍 Países de Veiculação</Label>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {COUNTRIES.map((country) => (
                          <div key={country.code} className="flex items-center space-x-2">
                            <Checkbox
                              id={`country-${country.code}`}
                              checked={selectedCountries.includes(country.code)}
                              onCheckedChange={() => toggleCountry(country.code)}
                            />
                            <label
                              htmlFor={`country-${country.code}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {country.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedCountries.includes("BR") && (
                      <div className="space-y-2">
                        <Label>📍 Estados do Brasil</Label>
                        <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                          {BRAZILIAN_STATES.map((state) => (
                            <div key={state.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`state-${state.code}`}
                                checked={selectedStates.includes(state.code)}
                                onCheckedChange={() => toggleState(state.code)}
                              />
                              <label
                                htmlFor={`state-${state.code}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {state.code} - {state.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Corretores Participantes</Label>
                      <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                        {profiles.map((profile) => (
                          <div key={profile.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={profile.id}
                              checked={selectedParticipants.includes(profile.id)}
                              onCheckedChange={() => toggleParticipant(profile.id)}
                            />
                            <label
                              htmlFor={profile.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {profile.full_name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingCampaign ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma campanha encontrada
              </p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Clique em "Nova Campanha" para começar
                </p>
              )}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {campaigns.map((campaign) => (
                <AccordionItem
                  key={campaign.id}
                  value={campaign.id}
                  className="border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full text-left pr-4 gap-2">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">{campaign.construtora}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {campaign.empreendimento}
                          </p>
                          {renderLocationInfo(campaign)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(campaign.status)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.campaign_participants?.filter(p => p.user_id).length || 0}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                       {/* Participants */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Corretores Participantes:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {campaign.campaign_participants && campaign.campaign_participants.filter(p => p.user_id).length > 0 ? (
                            campaign.campaign_participants
                              .filter(p => p.user_id)
                              .map((participant, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1.5">
                                  <User className="h-3 w-3" />
                                  {participant.profiles.full_name}
                                </Badge>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Nenhum corretor vinculado
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {campaign.link_anuncio && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={campaign.link_anuncio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver Criativo
                            </a>
                          </Button>
                        )}

                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(campaign)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
    </div>
  );
}
