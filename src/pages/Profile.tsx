import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Award, User } from "lucide-react";
import { profileUpdateSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { validateImageFile } from "@/lib/imageUtils";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { formatPhone, unformatPhone } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [profile, setProfile] = useState({
    full_name: "",
    whatsapp: "",
    avatar_url: "",
    gender: "",
    team: "",
    creci: "",
    points: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        ...data,
        whatsapp: formatPhone(data.whatsapp)
      });
    }
  };

  const getRankingBadge = (points: number) => {
    if (points >= 300) {
      return { label: "💎 Expert", variant: "default" as const, color: "text-purple-600" };
    } else if (points >= 150) {
      return { label: "🥇 Avançado", variant: "default" as const, color: "text-yellow-600" };
    } else if (points >= 50) {
      return { label: "🥈 Consistente", variant: "secondary" as const, color: "text-gray-600" };
    } else {
      return { label: "🥉 Iniciante", variant: "outline" as const, color: "text-orange-600" };
    }
  };

  const handleSelectAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const validation = validateImageFile(file);
    
    if (!validation.valid) {
      toast({
        title: "Arquivo inválido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploading(true);

    try {
      // Deletar avatar antigo se existir
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          avatar_url: publicUrl,
          profile_onboarding_completed: true 
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      
      // Clear cache and notify Header
      localStorage.removeItem("user_profile_cache");
      window.dispatchEvent(new CustomEvent('profile-updated', { 
        detail: { avatar_url: publicUrl } 
      }));
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validated = profileUpdateSchema.parse({
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        gender: profile.gender || "",
        team: profile.team || "",
        creci: profile.creci || "",
      });

      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          whatsapp: unformatPhone(validated.whatsapp),
          gender: validated.gender || null,
          team: validated.team || null,
          creci: validated.creci || null,
          profile_onboarding_completed: true,
        })
        .eq("id", user.id);

      setLoading(false);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram atualizadas com sucesso",
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const rankingBadge = getRankingBadge(profile.points);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 max-w-2xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meu Perfil
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Points and Ranking Display */}
                <div className="flex flex-col items-center gap-2">
                  <Badge variant={rankingBadge.variant} className={`text-sm ${rankingBadge.color}`}>
                    {rankingBadge.label}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-medium">{profile.points} pontos</span>
                  </div>
                </div>
              </div>

              <div className="flex md:ml-auto">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectAvatar}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Enviando..." : "Alterar Foto"}
                </Button>

                <ImageCropDialog
                  open={cropDialogOpen}
                  onOpenChange={setCropDialogOpen}
                  imageSrc={selectedImage}
                  onCropComplete={handleCropComplete}
                />
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creci">CRECI (Opcional)</Label>
                  <Input
                    id="creci"
                    placeholder="Ex: F123456 ou 123456"
                    value={profile.creci}
                    onChange={(e) => setProfile({ ...profile, creci: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={profile.gender || ""}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecione seu gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Usado para personalizar mensagens (qualquer identidade é válida)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(47) 9 9999-9999"
                    value={profile.whatsapp}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setProfile({ ...profile, whatsapp: formatted });
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Equipe</Label>
                  <Select
                    value={profile.team || "none"}
                    onValueChange={(value) => setProfile({ ...profile, team: value === "none" ? "" : value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Selecione sua equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma equipe</SelectItem>
                      <SelectItem value="Equipe Leão">🦁 Equipe Leão</SelectItem>
                      <SelectItem value="Equipe Lobo">🐺 Equipe Lobo</SelectItem>
                      <SelectItem value="Equipe Águia">🦅 Equipe Águia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Identifica sua equipe dentro da imobiliária
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Sistema de Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <span className="text-2xl">🥉</span>
                      <div className="text-right">
                        <p className="font-medium text-sm">Iniciante</p>
                        <p className="text-xs text-muted-foreground">0-49 pts</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                      <span className="text-2xl">🥈</span>
                      <div className="text-right">
                        <p className="font-medium text-sm">Consistente</p>
                        <p className="text-xs text-muted-foreground">50-149 pts</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <span className="text-2xl">🥇</span>
                      <div className="text-right">
                        <p className="font-medium text-sm">Avançado</p>
                        <p className="text-xs text-muted-foreground">150-299 pts</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <span className="text-2xl">💎</span>
                      <div className="text-right">
                        <p className="font-medium text-sm">Expert</p>
                        <p className="text-xs text-muted-foreground">300+ pts</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium text-sm mb-2">Como ganhar pontos:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>📚 Completar aula: <strong>+10 pts</strong></p>
                      <p>📋 Copiar mensagem: <strong>+5 pts</strong></p>
                      <p>👍 Avaliar mensagem: <strong>+5 pts</strong></p>
                      <p className="text-xs mt-2 opacity-70">Máximo 25 pts/dia em Playbooks</p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm">
                      Você está em <strong className={rankingBadge.color}>{rankingBadge.label}</strong> com <strong>{profile.points} pontos</strong>.
                      {(() => {
                        const thresholds = [
                          { name: "Iniciante", min: 0, max: 49 },
                          { name: "Consistente", min: 50, max: 149 },
                          { name: "Avançado", min: 150, max: 299 },
                          { name: "Expert", min: 300, max: Infinity },
                        ];
                        const currentLevel = thresholds.find(t => profile.points <= t.max);
                        const nextLevel = thresholds[thresholds.indexOf(currentLevel!) + 1];
                        const pointsToNext = nextLevel ? nextLevel.min - profile.points : 0;
                        
                        if (nextLevel) {
                          return <> Faltam <strong>{pointsToNext} pontos</strong> para <strong>{nextLevel.name}</strong>!</>;
                        }
                        return <> Você alcançou o nível máximo! 🎉</>;
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
