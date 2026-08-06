-- ==============================================================================
-- SCRIPT DI AGGIORNAMENTO SUPABASE: EVENTI, STORICO E MODIFICHE STRUTTURALI
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELLA EVENTI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.eventi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titolo TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    data_inizio TEXT NOT NULL, -- formato YYYY-MM-DD
    data_fine TEXT NOT NULL,   -- formato YYYY-MM-DD
    attivo BOOLEAN DEFAULT true NOT NULL,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;

-- Policy di lettura pubblica eventi
DROP POLICY IF EXISTS "Lettura pubblica eventi" ON public.eventi;
CREATE POLICY "Lettura pubblica eventi" 
ON public.eventi FOR SELECT 
USING (true);

-- Policy di gestione eventi per admin
DROP POLICY IF EXISTS "Gestione eventi per admin" ON public.eventi;
CREATE POLICY "Gestione eventi per admin" 
ON public.eventi FOR ALL 
USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------------------------
-- 2. TABELLA STORICO APPUNTAMENTI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appuntamenti_storico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbiere_id UUID, -- Nessun vincolo foreign key per mantenere i dati se il barbiere viene eliminato
    servizio_nome TEXT NOT NULL,
    servizio_durata INTEGER NOT NULL,
    servizio_costo NUMERIC NOT NULL,
    data TEXT NOT NULL,
    ora TEXT NOT NULL,
    cliente_nome TEXT NOT NULL,
    cliente_telefono TEXT,
    note TEXT,
    stato TEXT DEFAULT 'Richiesto' NOT NULL,
    confermato_da TEXT,
    inserito_da TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appuntamenti_storico ENABLE ROW LEVEL SECURITY;

-- Policy di gestione storico per admin
DROP POLICY IF EXISTS "Gestione storico per admin" ON public.appuntamenti_storico;
CREATE POLICY "Gestione storico per admin" 
ON public.appuntamenti_storico FOR ALL 
USING (auth.role() = 'authenticated');

-- Funzione per archiviare gli appuntamenti della giornata appena conclusa
CREATE OR REPLACE FUNCTION archivia_appuntamenti_giornalieri()
RETURNS void AS $$
BEGIN
  -- Copia nello storico tutti gli appuntamenti con data precedente a oggi
  INSERT INTO public.appuntamenti_storico
  SELECT * FROM public.appuntamenti
  WHERE data < to_char(current_date, 'YYYY-MM-DD');

  -- Elimina gli appuntamenti copiati dalla tabella attiva
  DELETE FROM public.appuntamenti
  WHERE data < to_char(current_date, 'YYYY-MM-DD');
END;
$$ LANGUAGE plpgsql;

-- Attivazione Cron Job (Richiede estensione pg_cron abilitata in Database -> Extensions)
-- Esegue la pulizia tutti i giorni alle 06:01 AM (orario server)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule('backup_appuntamenti');
    PERFORM cron.schedule('backup_appuntamenti', '1 6 * * *', 'SELECT archivia_appuntamenti_giornalieri();');
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 3. AGGIORNAMENTI VETRINA (Indirizzo splittato e Orario Pulizia)
-- ------------------------------------------------------------------------------
ALTER TABLE public.vetrina 
DROP COLUMN IF EXISTS info_indirizzo;

ALTER TABLE public.vetrina
ADD COLUMN IF NOT EXISTS info_via TEXT DEFAULT 'Via Roma',
ADD COLUMN IF NOT EXISTS info_numero TEXT DEFAULT '42',
ADD COLUMN IF NOT EXISTS info_cap TEXT DEFAULT '20121',
ADD COLUMN IF NOT EXISTS info_citta TEXT DEFAULT 'Milano',
ADD COLUMN IF NOT EXISTS info_provincia TEXT DEFAULT 'MI',
ADD COLUMN IF NOT EXISTS orario_pulizia_storico TEXT DEFAULT '06:01',
ADD COLUMN IF NOT EXISTS hero_immagine TEXT DEFAULT 'assets/images/hero-bg.jpg';


-- ------------------------------------------------------------------------------
-- 4. AGGIORNAMENTI BARBIERI (Campo Contatto)
-- ------------------------------------------------------------------------------
ALTER TABLE public.barbieri
ADD COLUMN IF NOT EXISTS contatto TEXT DEFAULT '';


-- ------------------------------------------------------------------------------
-- 5. AGGIORNAMENTO PERMESSI ADMIN
-- ------------------------------------------------------------------------------
-- Aggiunge Eventi e Storico e Rimuove Settings per il Ruolo Admin Principale
UPDATE public.ruoli 
SET permessi = '["appointments", "services", "schedule", "barbers", "users", "vetrina", "personale", "storico", "eventi"]'::jsonb
WHERE nome_ruolo ILIKE '%admin%';
