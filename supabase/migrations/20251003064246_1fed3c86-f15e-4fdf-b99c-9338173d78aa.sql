-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel TEXT NOT NULL,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_message_feedback table
CREATE TABLE public.user_message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('like', 'dislike', 'copy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, message_id, feedback_type)
);

-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  suggestion_text TEXT NOT NULL CHECK (char_length(suggestion_text) <= 200),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table for Central de Recursos
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'link', 'video')),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for messages
CREATE POLICY "Everyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Only admins can manage messages" ON public.messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_message_feedback
CREATE POLICY "Users can view own feedback" ON public.user_message_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.user_message_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.user_message_feedback FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for suggestions
CREATE POLICY "Users can view own suggestions" ON public.suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestions" ON public.suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all suggestions" ON public.suggestions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update suggestions" ON public.suggestions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for resources
CREATE POLICY "Everyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Only admins can manage resources" ON public.resources FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
  );
  
  -- Assign corretor role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert initial messages from the current INITIAL_MESSAGES
INSERT INTO public.messages (funnel, stage, title, content, likes, dislikes, display_order) VALUES
-- Abordagem – Lead Novo
('lead-novo', '1ª Abordagem', 'Saudação Inicial', '👋 Oi [NOME]! Tudo bem? Vi que você demonstrou interesse em imóveis aqui em Itapema. Sou [CORRETOR], conselheiro da COMARC. Posso te ajudar a encontrar a opção que mais combina com o que você procura?', 45, 3, 1),
('lead-novo', '2ª Abordagem', 'Confirmação de Recebimento', '👋 Oi [NOME], tudo bem? Só passando pra confirmar se você recebeu as informações sobre o [EMPREENDEDIMENTO]. Quer que eu te envie os detalhes ou as fotos?', 38, 5, 2),
('lead-novo', '3ª Abordagem', 'Objetivo do Cliente', '👋 Oi [NOME], notei que você demonstrou interesse no [EMPREENDEDIMENTO]. Está buscando algo pra morar ou investir?', 52, 2, 3),
('lead-novo', '4ª Abordagem', 'Resumo Rápido', '👋 [NOME], tudo bem? Vi que ainda não conseguimos falar. Quer que eu te mande um resumo rápido do [EMPREENDEDIMENTO]?', 29, 8, 4),
('lead-novo', '5ª Abordagem', 'Condições Especiais', '👋 Oi [NOME], passando pra avisar que ainda temos boas condições no [EMPREENDEDIMENTO]. Posso te enviar um comparativo de valores?', 41, 4, 5),
('lead-novo', '6ª Abordagem', 'Dia a Dia Corrido', '👋 [NOME], sei que o dia a dia é corrido. Só pra não perder a chance: ainda tem interesse no [EMPREENDEDIMENTO]?', 33, 6, 6),
('lead-novo', '7ª Abordagem', 'Último Contato', '👋 Oi [NOME], última vez que entro em contato pra não te incomodar 🙂 Quer que eu te mostre as condições atuais do [EMPREENDEDIMENTO]?', 27, 9, 7),

-- Atendimento Geral - Sondagem
('atendimento', 'Sondagem', 'Objetivo da Compra', '👋 Oi [NOME]! Vi que você pediu infos do [EMPREENDEDIMENTO]. Pra eu te ajudar melhor: você pensa em comprar pra morar ou pra investir?', 67, 1, 1),
('atendimento', 'Sondagem', 'Localização Atual', 'Entendi 👍 E hoje você já mora na região ou está pensando em vir pra cá?', 54, 3, 2),
('atendimento', 'Sondagem', 'Prioridades', 'Legal! O que mais é importante pra você nesse novo imóvel? (ex.: vista, lazer, nº de suítes, localização…)', 61, 2, 3),
('atendimento', 'Sondagem', 'Preferência de Região', 'Tem alguma região ou bairro que você prefira?', 48, 4, 4),
('atendimento', 'Sondagem', 'Número de Quartos', 'Quantos quartos você imagina que precisa pra ficar confortável?', 52, 2, 5),
('atendimento', 'Sondagem', 'Faixa de Valor', 'Pra eu te mostrar as opções certas, tem uma faixa de valor que você está pensando?', 44, 8, 6),
('atendimento', 'Sondagem', 'Prazo', 'Existe algum prazo ou data importante pra essa compra?', 39, 5, 7),
('atendimento', 'Sondagem', 'Transição para Envio', 'Perfeito. Com base nisso, posso te enviar 2 opções alinhadas ao que você busca. Quer que eu te envie agora?', 73, 1, 8),

-- Atendimento Geral - Apresentação do Produto
('atendimento', 'Apresentação do Produto', 'Primeiro Envio de Opções', '👋 [NOME], com base no que você me contou, separei duas opções que acredito que podem encaixar muito bem no que você busca. Quer que eu te envie as fotos e detalhes pra dar uma olhada?', 68, 2, 1),
('atendimento', 'Apresentação do Produto', 'Envio com Benefício Destacado', '👋 [NOME], encontrei uma opção que acho que vai te surpreender. O [EMPREENDEDIMENTO] tem [CARACTERÍSTICA CHAVE: ex. vista para o mar, lazer completo, ótima valorização] e está com condição especial no momento. Quer que eu te envie as plantas e os valores?', 71, 3, 2),
('atendimento', 'Apresentação do Produto', 'Envolvendo o Cliente na Escolha', '👋 [NOME], selecionei algumas opções de acordo com o que conversamos. Quer que eu te envie primeiro as que têm [DIFERENCIAL: ex. maior área de lazer, unidades com vista, pronto para morar] ou prefere ver as que têm o melhor custo-benefício?', 59, 4, 3),
('atendimento', 'Apresentação do Produto', 'Reforço de Escassez', '👋 [NOME], as últimas unidades do [EMPREENDEDIMENTO] estão com condição especial e acredito que valem a pena conhecer. Quer que eu te envie as informações antes que as melhores unidades sejam vendidas?', 64, 5, 4),

-- Atendimento Geral - Visita / Call
('atendimento', 'Visita / Call', 'Agendar Reunião Online', '👋 [NOME], podemos agendar uma reunião online pra te apresentar melhor o [EMPREENDEDIMENTO] e tirar todas as dúvidas? Tenho disponibilidade [DIA/HORA].', 76, 2, 1),
('atendimento', 'Visita / Call', 'Call Rápida', '👋 [NOME], que tal fazermos uma call rápida pra te mostrar os detalhes do [EMPREENDEDIMENTO]? É bem prático e você consegue ver tudo sem sair de casa.', 69, 4, 2),

-- Atendimento Geral - Proposta
('atendimento', 'Proposta', 'Abertura Consultiva', '👋 [NOME], com base na unidade que você mais gostou, já conseguimos calcular as condições ideais. Quer que eu te envie a proposta pra analisarmos juntos?', 72, 3, 1),
('atendimento', 'Proposta', 'Proposta com Urgência', '👋 [NOME], a condição especial que comentei está garantida até [DATA]. Quer que eu te envie a proposta detalhada pra avaliarmos e garantir essa condição?', 65, 6, 2),
('atendimento', 'Proposta', 'Oportunidade de Investimento', '👋 [NOME], com a valorização prevista pra região e a condição que conseguimos, acredito que essa proposta do [EMPREENDEDIMENTO] está muito vantajosa. Quer dar uma olhada agora pra ver os números?', 70, 4, 3),
('atendimento', 'Proposta', 'Foco em Segurança', '👋 [NOME], já deixei a proposta pronta e podemos revisar juntos na call. Assim consigo te mostrar cada detalhe e esclarecer dúvidas na hora. Que dia/hora é melhor pra você?', 68, 5, 4),

-- Atendimento Geral - Fechamento
('atendimento', 'Fechamento', 'Urgência Comercial', '👋 [NOME], só confirmando: conseguimos manter aquela condição especial até [DATA]. Quer aproveitar e garantir a unidade antes que o preço mude?', 58, 7, 1),
('atendimento', 'Fechamento', 'Exclusividade / Escassez', '👋 [NOME], as unidades do [EMPREENDEDIMENTO] com as melhores condições estão quase esgotando. Se quiser garantir a sua com essa condição, consigo reservar pra você até [DATA].', 64, 5, 2),
('atendimento', 'Fechamento', 'Oportunidade de Investimento', '👋 [NOME], essa condição do [EMPREENDEDIMENTO] é muito rara pra imóveis nessa região. Podemos fechar até [DATA] pra você não perder a valorização que vem por aí.', 61, 6, 3),

-- Repescagem
('repescagem', 'Reativação', 'Retomada de Contato', '👋 Oi [NOME], aqui é o [CORRETOR] da COMARC. Vi que você pediu informações sobre o [EMPREENDEDIMENTO] um tempo atrás. Chegou a encontrar algo que gostou ou ainda está avaliando opções?', 34, 9, 1),
('repescagem', 'Reativação', 'Novidade Relevante', '👋 [NOME], tudo bem? Só queria saber se você continua interessado em imóveis na região de [CIDADE]. Tem um detalhe novo no [EMPREENDEDIMENTO] que acho que pode te interessar. Quer que eu te conte?', 41, 6, 2),
('repescagem', 'Reativação', 'Condição Especial', '👋 Oi [NOME], aqui é o [CORRETOR]. Sei que você já recebeu contatos antes, mas queria te atualizar: temos uma condição especial no [EMPREENDEDIMENTO] válida por poucos dias. Posso te enviar agora?', 38, 7, 3),

-- Nutrição - Educação
('nutricao', 'Educação', 'Valorização da Região', '👋 Oi [NOME], compartilho essa novidade: [LINK]. É sobre a valorização da região de [CIDADE]/[BAIRRO]. Achei que poderia te interessar.', 28, 4, 1),
('nutricao', 'Educação', 'Dados de Mercado', '👋 [NOME], sabia que [CIDADE] teve valorização média de X% no último ano? Isso reforça as oportunidades de investimento. Se quiser, te mostro algumas opções.', 36, 3, 2),

-- Nutrição - Oportunidades
('nutricao', 'Oportunidades', 'Novo Empreendimento', '👋 Oi [NOME], saiu um novo empreendimento em [BAIRRO], com perfil parecido ao que você buscou. Quer dar uma olhada rápida nas plantas?', 42, 5, 1);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);