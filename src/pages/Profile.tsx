import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Award } from "lucide-react";
import { profileUpdateSchema } from "@/lib/validations";
import { ZodError } from "zod";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    whatsapp: "",
    avatar_url: "",
    gender: "",
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
      setProfile(data);
    }
  };

  const getRankingBadge = (points: number) => {
    if (points >= 1000) {
      return { label: "💎 Expert", variant: "default" as const, color: "text-purple-600" };
    } else if (points >= 501) {
      return { label: "🥇 Avançado", variant: "default" as const, color: "text-yellow-600" };
    } else if (points >= 101) {
      return { label: "🥈 Consistente", variant: "secondary" as const, color: "text-gray-600" };
    } else {
      return { label: "🥉 Iniciante", variant: "outline" as const, color: "text-orange-600" };
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setUploading(false);

    if (updateError) {
      toast({
        title: "Erro ao atualizar",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, avatar_url: publicUrl });
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso",
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validated = profileUpdateSchema.parse({
        fullName: profile.full_name,
        whatsapp: profile.whatsapp,
      });

      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.fullName,
          whatsapp: validated.whatsapp,
          gender: profile.gender || null,
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
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais e foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadAvatar}
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
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Usado para personalizar mensagens de boas-vindas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  disabled={loading}
                />
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
