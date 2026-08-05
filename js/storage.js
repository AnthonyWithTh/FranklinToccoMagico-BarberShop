window.FranklinApp = window.FranklinApp || {};

// Inizializza Supabase
const supabaseUrl = 'https://ceaeejgnagomrndbyvcd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYWVlamduYWdvbXJuZGJ5dmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjUzMjIsImV4cCI6MjEwMTUwMTMyMn0.IFiyzENjAr1RSConnGGoV6MFhE7NVo771PwIpEzFh2A';
const sbClient = window.supabase.createClient(supabaseUrl, supabaseKey);

FranklinApp.Storage = {
  supabase: sbClient,

  fixImagePath(path, inAdmin = false) {
    if (!path || !path.trim()) {
      return inAdmin ? '../assets/images/hero-bg.jpg' : 'assets/images/hero-bg.jpg';
    }
    const cleanPath = path.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
      return cleanPath;
    }
    // Per percorsi locali o storage bucket
    const normalized = cleanPath.replace(/^(\.\.\/|\.\/|\/)+/, '');
    return inAdmin ? '../' + normalized : normalized;
  },

  async ottieniServizi() {
    const { data, error } = await sbClient.from('servizi').select('*').order('created_at', { ascending: true });
    if (error) console.error("Errore fetch servizi:", error);
    return data || [];
  },
  
  async aggiungiServizio(datiServizio) {
    const { data, error } = await sbClient.from('servizi').insert([datiServizio]).select();
    if (error) { console.error(error); return null; }
    return data[0].id;
  },
  
  async aggiornaServizio(id, datiAggiornati) {
    const { error } = await sbClient.from('servizi').update(datiAggiornati).eq('id', id);
    return !error;
  },
  
  async toggleServizio(id) {
    const { data: current } = await sbClient.from('servizi').select('attivo').eq('id', id).single();
    if (current) {
        const { error } = await sbClient.from('servizi').update({ attivo: !current.attivo }).eq('id', id);
        return !error ? !current.attivo : current.attivo;
    }
    return false;
  },
  
  async eliminaServizio(id) {
    const { error } = await sbClient.from('servizi').delete().eq('id', id);
    return !error;
  },

  async ottieniBarbieri() {
    const { data, error } = await sbClient.from('barbieri').select('*').order('created_at', { ascending: true });
    if (error) console.error("Errore fetch barbieri:", error);
    return data || [];
  },
  
  async aggiungiBarbiere(datiBarbiere) {
    const { data, error } = await sbClient.from('barbieri').insert([datiBarbiere]).select();
    if (error) { console.error(error); return null; }
    return data[0].id;
  },
  
  async aggiornaBarbiere(id, datiAggiornati) {
    const { error } = await sbClient.from('barbieri').update(datiAggiornati).eq('id', id);
    return !error;
  },
  
  async toggleBarbiere(id) {
    const { data: current } = await sbClient.from('barbieri').select('attivo').eq('id', id).single();
    if (current) {
        const { error } = await sbClient.from('barbieri').update({ attivo: !current.attivo }).eq('id', id);
        return !error ? !current.attivo : current.attivo;
    }
    return false;
  },
  
  async eliminaBarbiere(id) {
    const { error } = await sbClient.from('barbieri').delete().eq('id', id);
    return !error;
  },

  async ottieniAppuntamenti() {
    const { data, error } = await sbClient.from('appuntamenti').select('*').order('data', { ascending: true }).order('ora', { ascending: true });
    if (error) console.error("Errore fetch appuntamenti:", error);
    return data || [];
  },
  
  async aggiungiAppuntamento(datiApp) {
    const { data, error } = await sbClient.from('appuntamenti').insert([datiApp]).select();
    if (error) { console.error(error); return null; }
    return data[0].id;
  },
  
  async aggiornaAppuntamento(id, datiAggiornati) {
    const { error } = await sbClient.from('appuntamenti').update(datiAggiornati).eq('id', id);
    return !error;
  },
  
  async eliminaAppuntamento(id) {
    const { error } = await sbClient.from('appuntamenti').delete().eq('id', id);
    return !error;
  },

  async ottieniImpostazioni() {
    const { data, error } = await sbClient.from('impostazioni').select('*').eq('id', 1).single();
    if (error) {
        console.error("Errore fetch impostazioni:", error);
        return { nomeNegozio: 'Franklin Barber Shop', indirizzo: '', telefono: '', email: '', orari: {}, chiusureEccezionali: [] };
    }
    return data;
  },
  
  async salvaImpostazioni(impostazioni) {
    const { error } = await sbClient.from('impostazioni').update(impostazioni).eq('id', 1);
    return !error;
  },

  async ottieniAuth() {
    const { data, error } = await sbClient.from('utenti').select('*');
    if (error) return null;
    return {
        utenti: data,
        ruoli: [
          {
            id: 'ruolo_admin',
            nome: 'Amministratore',
            permessi: ['appointments', 'services', 'schedule', 'barbers', 'settings', 'users', 'vetrina', 'personale']
          }
        ]
    };
  },
  
  async salvaAuth(dati) { return false; },

  async inizializza() {
    console.log("Supabase inizializzato e collegato.");
  },

  esportaTutto() { return ""; },
  importaTutto(jsonData) { return false; }
};
