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
    const { data, error } = await sbClient.from('barbieri').select('*, barbieri_permessi(*)').order('created_at', { ascending: true });
    if (error) {
        console.error("Errore fetch barbieri:", error);
        return [];
    }
    
    // Mappa per il frontend
    return (data || []).map(b => {
        return {
            ...b,
            eta: b.data_nascita || '', // fallback per retrocompatibilità se qualche codice si aspetta 'eta' nel payload UI
            data_nascita: b.data_nascita || '',
            giorniEccezionali: (b.barbieri_permessi || []).map(p => ({
                id: p.id,
                data: p.data,
                motivo: p.motivo,
                interaGiornata: p.intera_giornata,
                dalle: p.dalle,
                alle: p.alle
            }))
        };
    });
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

  async salvaPermessoBarbiere(barbiereId, permesso) {
    const row = {
      barbiere_id: barbiereId,
      data: permesso.data,
      motivo: permesso.motivo,
      intera_giornata: permesso.interaGiornata,
      dalle: permesso.dalle || '',
      alle: permesso.alle || ''
    };
    if (permesso.id) {
        const { error } = await sbClient.from('barbieri_permessi').update(row).eq('id', permesso.id);
        if (error) { console.error("Errore modifica permesso:", error); return false; }
    } else {
        const { error } = await sbClient.from('barbieri_permessi').insert([row]);
        if (error) { console.error("Errore inserimento permesso:", error); return false; }
    }
    return true;
  },

  async eliminaPermessoBarbiere(id) {
    const { error } = await sbClient.from('barbieri_permessi').delete().eq('id', id);
    if (error) { console.error("Errore eliminazione permesso:", error); return false; }
    return true;
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
    // 1. Impostazioni Base
    const { data: imp, error } = await sbClient.from('impostazioni').select('*').eq('id', 1).single();
    if (error) console.error("Errore fetch impostazioni:", error);
    const result = imp || { nomeNegozio: 'Franklin Barber Shop', indirizzo: '', telefono: '', email: '' };
    
    // 2. Orari di Lavoro
    const { data: orari, error: errOrari } = await sbClient.from('orari_lavoro').select('*');
    if (errOrari) {
        console.error("Errore fetch orari:", errOrari);
        alert("Errore caricamento orari da Supabase: " + (errOrari.message || JSON.stringify(errOrari)));
    }
    
    const orariMap = {};
    if (orari && !errOrari) {
        orari.forEach(o => {
            orariMap[o.giorno] = {
                chiuso: o.chiuso,
                mattinaApertura: o.mattina_apertura || '',
                mattinaChiusura: o.mattina_chiusura || '',
                pomeriggioApertura: o.pomeriggio_apertura || '',
                pomeriggioChiusura: o.pomeriggio_chiusura || ''
            };
        });
    }
    result.orariLavoro = orariMap;
    
    // 3. Giorni Eccezionali
    const { data: ecc, error: errEcc } = await sbClient.from('giorni_eccezionali').select('*');
    if (errEcc) {
        console.error("Errore fetch eccezioni:", errEcc);
        alert("Errore caricamento festività da Supabase: " + (errEcc.message || JSON.stringify(errEcc)));
    }
    
    const eccList = [];
    if (ecc && !errEcc) {
        ecc.forEach(e => {
            eccList.push({
                data: e.data,
                motivo: e.motivo,
                tipo: e.tipo,
                interaGiornata: e.intera_giornata,
                dalle: e.dalle || '',
                alle: e.alle || ''
            });
        });
    }
    result.giorniEccezionali = eccList;
    
    return result;
  },
  
  async salvaImpostazioni(impostazioni) {
    // 1. Salva Impostazioni Base
    const baseData = {
        nomeNegozio: impostazioni.nomeNegozio,
        indirizzo: impostazioni.indirizzo,
        telefono: impostazioni.telefono,
        email: impostazioni.email
    };
    await sbClient.from('impostazioni').update(baseData).eq('id', 1);
    
    // 2. Salva Orari di Lavoro (Upsert)
    if (impostazioni.orariLavoro) {
        const dayIds = { lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6, domenica: 7 };
        const orariRows = Object.keys(impostazioni.orariLavoro).map(giorno => {
            const o = impostazioni.orariLavoro[giorno];
            return {
                id: dayIds[giorno] || 0,
                giorno: giorno,
                chiuso: o.chiuso,
                mattina_apertura: o.mattinaApertura || '',
                mattina_chiusura: o.mattinaChiusura || '',
                pomeriggio_apertura: o.pomeriggioApertura || '',
                pomeriggio_chiusura: o.pomeriggioChiusura || ''
            };
        });
        if (orariRows.length > 0) {
            const { error: errOrari } = await sbClient.from('orari_lavoro').upsert(orariRows, { onConflict: 'id' });
            if (errOrari) {
                console.error("Errore salvataggio orari:", errOrari);
                alert("Errore salvataggio orari: " + (errOrari.message || JSON.stringify(errOrari)));
            }
        }
    }
    
    // 3. Salva Giorni Eccezionali (Sostituzione completa come array)
    if (impostazioni.giorniEccezionali) {
        const { data: eccAttuali, error: errEccCheck } = await sbClient.from('giorni_eccezionali').select('data');
        if (errEccCheck) {
            console.error("Errore check eccezioni:", errEccCheck);
            alert("Errore check festività: " + (errEccCheck.message || JSON.stringify(errEccCheck)));
        }
        
        if (eccAttuali && eccAttuali.length > 0) {
            const datesToDelete = eccAttuali.map(e => e.data);
            const { error: errDel } = await sbClient.from('giorni_eccezionali').delete().in('data', datesToDelete);
            if (errDel) {
                console.error("Errore delete eccezioni:", errDel);
                alert("Errore rimozione vecchie festività: " + (errDel.message || JSON.stringify(errDel)));
            }
        }
        
        if (impostazioni.giorniEccezionali.length > 0) {
            const eccRows = impostazioni.giorniEccezionali.map(e => ({
                data: e.data,
                motivo: e.motivo,
                tipo: e.tipo,
                intera_giornata: e.interaGiornata,
                dalle: e.dalle || '',
                alle: e.alle || ''
            }));
            const { error: errIns } = await sbClient.from('giorni_eccezionali').insert(eccRows);
            if (errIns) {
                console.error("Errore inserimento eccezioni:", errIns);
                alert("Errore salvataggio nuove festività: " + (errIns.message || JSON.stringify(errIns)));
            }
        }
    }
    
    return true;
  },
  async inizializza() {
    console.log("Supabase inizializzato e collegato.");
  },

  esportaTutto() { return ""; },
  importaTutto(jsonData) { return false; }
};
