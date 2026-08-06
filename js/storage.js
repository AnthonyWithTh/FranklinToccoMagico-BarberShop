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
    if (!data) return [];
    
    return data.map(app => ({
      id: app.id.toString(),
      barbiereId: app.barbiere_id ? app.barbiere_id.toString() : null,
      servizioNome: app.servizio_nome,
      servizioDurata: app.servizio_durata,
      servizioCosto: app.servizio_costo,
      data: app.data,
      ora: app.ora ? app.ora.substring(0, 5) : '', // '14:30:00' -> '14:30'
      clienteNome: app.cliente_nome,
      clienteTelefono: app.cliente_telefono,
      note: app.note,
      stato: app.stato,
      confermatoDa: app.confermato_da,
      inseritoDa: app.inserito_da
    }));
  },
  
  async aggiungiAppuntamento(datiApp) {
    const payload = {
      barbiere_id: datiApp.barbiereId,
      servizio_nome: datiApp.servizioNome,
      servizio_durata: datiApp.servizioDurata,
      servizio_costo: datiApp.servizioCosto,
      data: datiApp.data,
      ora: datiApp.ora,
      cliente_nome: datiApp.clienteNome,
      cliente_telefono: datiApp.clienteTelefono || null,
      note: datiApp.note || '',
      stato: datiApp.stato || 'Richiesto',
      confermato_da: datiApp.confermatoDa || null,
      inserito_da: datiApp.inseritoDa || 'Cliente'
    };
    const { data, error } = await sbClient.from('appuntamenti').insert([payload]).select();
    if (error) { console.error("Errore aggiunta appuntamento:", error); return null; }
    return data[0].id;
  },
  
  async aggiornaAppuntamento(id, datiAggiornati) {
    const payload = {};
    if (datiAggiornati.barbiereId !== undefined) payload.barbiere_id = datiAggiornati.barbiereId;
    if (datiAggiornati.servizioNome !== undefined) payload.servizio_nome = datiAggiornati.servizioNome;
    if (datiAggiornati.servizioDurata !== undefined) payload.servizio_durata = datiAggiornati.servizioDurata;
    if (datiAggiornati.servizioCosto !== undefined) payload.servizio_costo = datiAggiornati.servizioCosto;
    if (datiAggiornati.data !== undefined) payload.data = datiAggiornati.data;
    if (datiAggiornati.ora !== undefined) payload.ora = datiAggiornati.ora;
    if (datiAggiornati.clienteNome !== undefined) payload.cliente_nome = datiAggiornati.clienteNome;
    if (datiAggiornati.clienteTelefono !== undefined) payload.cliente_telefono = datiAggiornati.clienteTelefono;
    if (datiAggiornati.note !== undefined) payload.note = datiAggiornati.note;
    if (datiAggiornati.stato !== undefined) payload.stato = datiAggiornati.stato;
    if (datiAggiornati.confermatoDa !== undefined) payload.confermato_da = datiAggiornati.confermatoDa;
    
    const { error } = await sbClient.from('appuntamenti').update(payload).eq('id', id);
    return !error;
  },
  
  async eliminaAppuntamento(id) {
    const { error } = await sbClient.from('appuntamenti').delete().eq('id', id);
    return !error;
  },

  // --- METODI STORICO APPUNTAMENTI ---
  async ottieniStoricoAppuntamenti(dataFiltro, barbiereFiltro) {
    let query = sbClient.from('appuntamenti_storico').select(`
      id, barbiere_id, servizio_nome, servizio_durata, servizio_costo,
      data, ora, cliente_nome, cliente_telefono, note, stato, confermato_da, inserito_da,
      barbieri ( nome, cognome )
    `).order('data', { ascending: false }).order('ora', { ascending: true });

    if (dataFiltro && dataFiltro !== 'tutte') {
        query = query.eq('data', dataFiltro);
    }
    if (barbiereFiltro && barbiereFiltro !== 'tutti') {
        query = query.eq('barbiere_id', barbiereFiltro);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Errore fetch storico appuntamenti:", error);
        return [];
    }

    return data.map(app => ({
      id: app.id,
      barbiereId: app.barbiere_id,
      barbiereNome: app.barbieri ? `${app.barbieri.nome} ${app.barbieri.cognome}` : 'N/A',
      servizioNome: app.servizio_nome,
      servizioDurata: app.servizio_durata,
      servizioCosto: app.servizio_costo,
      data: app.data,
      ora: app.ora,
      clienteNome: app.cliente_nome,
      clienteTelefono: app.cliente_telefono,
      note: app.note,
      stato: app.stato,
      confermatoDa: app.confermato_da,
      inseritoDa: app.inserito_da
    }));
  },

  async ottieniStatisticheStorico(dataFiltro, barbiereFiltro) {
    let query = sbClient.from('appuntamenti_storico').select('costo:servizio_costo', { count: 'exact' }).eq('stato', 'Completato');
    
    if (dataFiltro && dataFiltro !== 'tutte') {
        query = query.eq('data', dataFiltro);
    }
    if (barbiereFiltro && barbiereFiltro !== 'tutti') {
        query = query.eq('barbiere_id', barbiereFiltro);
    }

    const { data, count, error } = await query;
    if (error) {
        console.error("Errore fetch statistiche storico:", error);
        return { incasso: 0, clienti: 0 };
    }

    const incasso = data.reduce((sum, item) => sum + (parseFloat(item.costo) || 0), 0);
    return { incasso, clienti: count || 0 };
  },

  async ottieniImpostazioni() {
    // 1. Impostazioni Base da Vetrina
    const { data: imp, error } = await sbClient.from('vetrina').select('*').eq('id', 1).single();
    if (error) console.error("Errore fetch vetrina:", error);
    const result = imp || {};
    
    // 2. Orari di Lavoro
    const { data: orari, error: errOrari } = await sbClient.from('orari_lavoro').select('*');
    if (errOrari) {
        console.error("Errore fetch orari:", errOrari);
        alert("Errore caricamento orari da Supabase: " + (errOrari.message || JSON.stringify(errOrari)));
    }
    
    const orariMap = {};
    if (orari && !errOrari && orari.length > 0) {
        orari.forEach(o => {
            orariMap[o.giorno] = {
                chiuso: o.chiuso,
                orarioMattina: o.orario_mattina || '09:00-13:00',
                orarioPomeriggio: o.orario_pomeriggio || '15:00-19:00'
            };
        });
    } else {
        // Fallback ai dati iniziali se la tabella è vuota
        if (window.FranklinApp && window.FranklinApp.DatiIniziali && window.FranklinApp.DatiIniziali.orariLavoro) {
            Object.assign(orariMap, window.FranklinApp.DatiIniziali.orariLavoro);
        }
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
  
  async salvaVetrina(vetrinaData) {
    const { error } = await sbClient.from('vetrina').update(vetrinaData).eq('id', 1);
    if (error) {
        console.error("Errore salvataggio vetrina:", error);
        alert("Errore salvataggio vetrina: " + error.message);
        return false;
    }
    return true;
  },

  async salvaImpostazioni(impostazioni) {
    // 1. (Le impostazioni base ora sono gestite da salvaVetrina)

    
    // 2. Salva Orari di Lavoro (Upsert)
    if (impostazioni.orariLavoro) {
        const dayIds = { lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6, domenica: 7 };
        const orariRows = Object.keys(impostazioni.orariLavoro).map(giorno => {
            const o = impostazioni.orariLavoro[giorno];
            return {
                id: dayIds[giorno] || 0,
                giorno: giorno,
                chiuso: o.chiuso,
                orario_mattina: o.orarioMattina || '09:00-13:00',
                orario_pomeriggio: o.orarioPomeriggio || '15:00-19:00'
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
  importaTutto(jsonData) { return false; },

  // --- STORAGE BUCKET METHODS ---
  async uploadImmagine(file, cartella) {
    if (!file) return null;
    
    // Crea un nome file unico per evitare sovrascritture
    const ext = file.name.split('.').pop();
    const nomeOriginale = file.name.replace(`.${ext}`, '').replace(/[^a-zA-Z0-9]/g, '_');
    const nomeUnico = `${nomeOriginale}_${Date.now()}.${ext}`;

    const { data, error } = await sbClient.storage
      .from(cartella)
      .upload(nomeUnico, file);

    if (error) {
      console.error(`Errore upload immagine in ${cartella}:`, error);
      alert("Errore durante il caricamento dell'immagine: " + error.message);
      return null;
    }

    return this.getPublicUrl(cartella, nomeUnico);
  },
  
  async eliminaImmagine(cartella, nomeFile) {
    if (!nomeFile) return false;
    
    // Assicuriamoci di passare solo il nome del file e non tutto l'URL
    const fileName = nomeFile.split('/').pop();
    
    const { error } = await sbClient.storage
      .from(cartella)
      .remove([fileName]);
      
    if (error) {
      console.error(`Errore eliminazione immagine ${fileName} in ${cartella}:`, error);
      alert("Errore durante l'eliminazione: " + error.message);
      return false;
    }
    return true;
  },

  async listaImmagini(cartella) {
    const { data, error } = await sbClient.storage
      .from(cartella)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error(`Errore lista immagini in bucket ${cartella}:`, error);
      return [];
    }

    // Converti i file nei loro URL pubblici
    return data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => this.getPublicUrl(cartella, file.name));
  },

  getPublicUrl(cartella, nomeFile) {
    const { data } = sbClient.storage
      .from(cartella)
      .getPublicUrl(nomeFile);
    return data.publicUrl;
  }
};
