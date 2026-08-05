window.FranklinApp = window.FranklinApp || {};

FranklinApp.DateHelpers = {
  giorni: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledi', 'Giovedì', 'Venerdì', 'Sabato'],
  mesi: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],

  formattaData(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const giornoNome = this.giorni[d.getDay()];
    const giornoNum = d.getDate();
    const meseNome = this.mesi[d.getMonth()];
    const anno = d.getFullYear();
    return `${giornoNome} ${giornoNum} ${meseNome} ${anno}`;
  },

  formattaDataSenzaGiorno(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const giornoNum = d.getDate();
    const meseNome = this.mesi[d.getMonth()];
    const anno = d.getFullYear();
    return `${giornoNum} ${meseNome} ${anno}`;
  },

  formattaDataBreve(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT');
  },

  formattaOra(timeStr) {
    return timeStr || '';
  },

  oraInMinuti(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  },

  minutiInOra(minuti) {
    const h = Math.floor(minuti / 60);
    const m = minuti % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },

  ottieniGiornoSettimana(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const giorniBase = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    return giorniBase[d.getDay()];
  },

  oggi() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Controlla se il salone ed il barbiere sono aperti in un dato giorno
  isGiornoAperto(dateStr, barbiereId = null) {
    const slots = this.ottieniSlotDisponibili(dateStr, 15, barbiereId);
    return slots.length > 0;
  },

  controllaConflitto(data, oraInizioMin, durata, barbiereId, escludiId = null) {
    const appuntamenti = window.FranklinApp.Storage.ottieniAppuntamenti() || [];
    const oraFineMin = oraInizioMin + durata;

    // 1. Controlla accavallamento temporale con appuntamenti esistenti
    const haConflittoApp = appuntamenti.some(app => {
      if (app.data !== data || app.stato === 'cancellato') return false;
      if (barbiereId && app.barbiereId && app.barbiereId !== barbiereId) return false;
      if (escludiId && app.id === escludiId) return false;

      const servizi = window.FranklinApp.Storage.ottieniServizi() || [];
      const servizio = servizi.find(s => s.id === app.servizioId);
      const appDurata = app.durata ? parseInt(app.durata, 10) : (servizio ? parseInt(servizio.durata, 10) : 30);
      
      const appInizioMin = this.oraInMinuti(app.ora);
      const appFineMin = appInizioMin + appDurata;

      // Accavallamento: [oraInizioMin, oraFineMin] si sovrappone a [appInizioMin, appFineMin]
      return (oraInizioMin < appFineMin && oraFineMin > appInizioMin);
    });

    if (haConflittoApp) return true;

    // 2. Controlla accavallamento temporale con ferie/malattie/permessi/imprevisti del barbiere
    if (barbiereId) {
      const barbieri = window.FranklinApp.Storage.ottieniBarbieri() || [];
      const barbiere = barbieri.find(b => b.id === barbiereId);
      if (barbiere) {
        const assenze = [
          ...(barbiere.ferie || []),
          ...(barbiere.malattie || []),
          ...(barbiere.permessi || []),
          ...(barbiere.imprevisti || []),
          ...(barbiere.giorniEccezionali || []),
          ...(barbiere.giorniAssenza || []),
          ...(barbiere.assenze || [])
        ];

        const haConflittoPermesso = assenze.some(a => {
          if (typeof a === 'string') return a === data;
          const aData = a.data || a.giorno;
          if (aData && aData !== data) return false;
          if (a.da && a.a && (data < a.da || data > a.a)) return false;

          // Se è per l'intera giornata
          if (a.interaGiornata !== false && (!a.dalle && !a.oraInizio) && (!a.alle && !a.oraFine)) {
            return true;
          }

          // Se ha orari parziali (es. permesso 10:00 - 12:00)
          const dalleStr = a.dalle || a.oraInizio;
          const alleStr = a.alle || a.oraFine;
          if (dalleStr && alleStr) {
            const permInizio = this.oraInMinuti(dalleStr);
            const permFine = this.oraInMinuti(alleStr);
            return (oraInizioMin < permFine && oraFineMin > permInizio);
          }

          return true;
        });

        if (haConflittoPermesso) return true;
      }
    }

    return false;
  },

  ottieniSlotDisponibili(data, durataServizio = 30, barbiereId = null) {
    if (!data) return [];

    const impostazioni = window.FranklinApp.Storage.ottieniImpostazioni() || {};
    const giornoSettimana = this.ottieniGiornoSettimana(data);
    
    // 1. Controlla orari salone (supporta schema orariLavoro e orariApertura)
    const orariConfig = (impostazioni.orariLavoro && impostazioni.orariLavoro[giornoSettimana]) || 
                        (impostazioni.orariApertura && impostazioni.orariApertura[giornoSettimana]);
    
    if (!orariConfig) return [];
    if (orariConfig.chiuso === true || orariConfig.aperto === false) return [];

    // 2. Controlla Giorni Festivi & Imprevisti Salone
    const eccezioniSalone = impostazioni.giorniEccezionali || impostazioni.festivi || [];
    const eccezioneGiorno = eccezioniSalone.find(e => e.data === data);
    if (eccezioneGiorno) {
      if (eccezioneGiorno.interaGiornata !== false && (!eccezioneGiorno.dalle || !eccezioneGiorno.alle)) {
        return []; // Salone chiuso tutto il giorno per festività/imprevisto
      }
    }

    // 3. Controlla Barbiere (Ferie, Malattie, Permessi, Imprevisti, Assenze)
    if (barbiereId) {
      const barbieri = window.FranklinApp.Storage.ottieniBarbieri() || [];
      const barbiere = barbieri.find(b => b.id === barbiereId);
      if (!barbiere || barbiere.attivo === false) return [];

      const assenze = [
        ...(barbiere.ferie || []),
        ...(barbiere.malattie || []),
        ...(barbiere.permessi || []),
        ...(barbiere.imprevisti || []),
        ...(barbiere.giorniEccezionali || []),
        ...(barbiere.giorniAssenza || []),
        ...(barbiere.assenze || [])
      ];

      const assenzaTotale = assenze.find(a => {
        if (typeof a === 'string') return a === data;
        const aData = a.data || a.giorno;
        if (aData && aData !== data) return false;
        if (a.da && a.a && (data < a.da || data > a.a)) return false;
        return (a.interaGiornata !== false && (!a.dalle && !a.oraInizio) && (!a.alle && !a.oraFine));
      });

      if (assenzaTotale) {
        return []; // Barbiere assente per ferie/malattia tutto il giorno
      }
    }

    // 4. Calcola fasce orarie di apertura del giorno
    const fasce = [];
    
    // Supporto per il nuovo formato a range
    if (orariConfig.orarioMattina && orariConfig.orarioMattina.includes('-')) {
      const parts = orariConfig.orarioMattina.split('-');
      fasce.push({ inizio: parts[0], fine: parts[1] });
    } else if (orariConfig.mattinaApertura && orariConfig.mattinaChiusura) {
      fasce.push({ inizio: orariConfig.mattinaApertura, fine: orariConfig.mattinaChiusura });
    }
    
    if (orariConfig.orarioPomeriggio && orariConfig.orarioPomeriggio.includes('-')) {
      const parts = orariConfig.orarioPomeriggio.split('-');
      fasce.push({ inizio: parts[0], fine: parts[1] });
    } else if (orariConfig.pomeriggioApertura && orariConfig.pomeriggioChiusura) {
      fasce.push({ inizio: orariConfig.pomeriggioApertura, fine: orariConfig.pomeriggioChiusura });
    }
    
    if (fasce.length === 0 && (orariConfig.apertura || orariConfig.mattinaApertura)) {
      const ap = orariConfig.apertura || orariConfig.mattinaApertura;
      const ch = orariConfig.chiusura || orariConfig.pomeriggioChiusura || "19:00";
      fasce.push({ inizio: ap, fine: ch });
    }

    if (fasce.length === 0) return [];

    const intervallo = parseInt(impostazioni.intervalloSlot, 10) || 15;
    const slotDisponibili = [];
    const oggiStr = this.oggi();

    const oraAttualeObj = new Date();
    const adessoMinuti = (oraAttualeObj.getHours() * 60) + oraAttualeObj.getMinutes();

    fasce.forEach(fascia => {
      const minInizio = this.oraInMinuti(fascia.inizio);
      const minFine = this.oraInMinuti(fascia.fine);

      for (let min = minInizio; min <= minFine - durataServizio; min += intervallo) {
        // Se la data è oggi, escludi orari già passati
        if (data === oggiStr && min <= adessoMinuti + 10) continue;

        // Verifica accavallamenti con appuntamenti o permessi parziali
        if (!this.controllaConflitto(data, min, durataServizio, barbiereId)) {
          slotDisponibili.push(this.minutiInOra(min));
        }
      }
    });

    return slotDisponibili;
  }
};
