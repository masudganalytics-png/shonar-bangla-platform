CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations (user_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_session ON public.ai_conversations (session_id, updated_at DESC);
CREATE INDEX idx_ai_conversations_created ON public.ai_conversations (created_at DESC);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages (conversation_id, created_at);

GRANT SELECT, DELETE ON public.ai_conversations TO authenticated;
GRANT SELECT, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
GRANT ALL ON public.ai_messages TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admins read all conversations"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own conversations"
  ON public.ai_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins delete conversations"
  ON public.ai_conversations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own messages"
  ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
  ));

CREATE POLICY "Admins read all messages"
  ON public.ai_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own messages"
  ON public.ai_messages FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Admins delete messages"
  ON public.ai_messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_conversations_set_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();