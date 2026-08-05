window.FranklinApp = window.FranklinApp || {};

window.FranklinApp.Admin = {
  async inizializza() {
    await window.FranklinApp.Storage.inizializza();
    if (!(await window.FranklinApp.Auth.isAutenticato())) {
      window.location.href = 'login.html';
      return;
    }
  },

  async calcolaKPI() {
    const appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const oggi = window.FranklinApp.DateHelpers.oggi();
    
    const appOggi = appuntamenti.filter(a => a.data === oggi && a.stato !== 'cancellato');
    const inAttesa = appOggi.filter(a => a.stato === 'in_attesa').length;
    
    let ricaviStimati = 0;
    appOggi.forEach(a => {
      const serv = servizi.find(s => s.id === a.servizioId);
      if (serv) ricaviStimati += serv.prezzo;
    });

    
    // --- GESTIONE APPUNTAMENTI ---
    function apriModaleNuovoAppuntamento() {
        const modal = document.getElementById('modale-nuovo-appuntamento');
        if (!modal) return;
        
        // Popola Servizi
        const selectServizio = document.getElementById('nuovo-appuntamento-servizio');
        selectServizio.innerHTML = '<option value="">Seleziona un servizio...</option>';
        window.FranklinApp.Dati.servizi.forEach(s => {
            if (s.attivo) {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${s.nome} (${s.durata} min - €${s.prezzo})`;
                selectServizio.appendChild(opt);
            }
        });
        
        // Popola Barbieri
        const selectBarbiere = document.getElementById('nuovo-appuntamento-barbiere');
        selectBarbiere.innerHTML = '<option value="">Seleziona un barbiere...</option>';
        window.FranklinApp.Dati.barbieri.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.nome;
            selectBarbiere.appendChild(opt);
        });
        
        // Popola Orari (Ogni 30 min dalle 8:00 alle 20:00)
        const selectOra = document.getElementById('nuovo-appuntamento-ora');
        selectOra.innerHTML = '<option value="">Seleziona orario...</option>';
        for (let h = 8; h <= 19; h++) {
            ['00', '30'].forEach(m => {
                const opt = document.createElement('option');
                const time = `${h.toString().padStart(2, '0')}:${m}`;
                opt.value = time;
                opt.textContent = time;
                selectOra.appendChild(opt);
            });
        }
        
        // Imposta data di default (Oggi)
        const dateInput = document.getElementById('nuovo-appuntamento-data');
        const todayStr = window.FranklinApp.DateHelpers.oggi();
        dateInput.value = todayStr;
        dateInput.min = todayStr;
        
        modal.style.display = 'flex';
    }
    
    function chiudiModaleNuovoAppuntamento() {
        const modal = document.getElementById('modale-nuovo-appuntamento');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('form-nuovo-appuntamento').reset();
        }
    }
    
    async function salvaNuovoAppuntamento(event) {
        event.preventDefault();
        
        const servizioId = document.getElementById('nuovo-appuntamento-servizio').value;
        const barbiereId = document.getElementById('nuovo-appuntamento-barbiere').value;
        const dataStr = document.getElementById('nuovo-appuntamento-data').value;
        const oraStr = document.getElementById('nuovo-appuntamento-ora').value;
        const nomeCliente = document.getElementById('nuovo-appuntamento-cliente').value;
        const telCliente = document.getElementById('nuovo-appuntamento-telefono').value;
        
        const serviziData = await window.FranklinApp.Storage.ottieniServizi();
        const servizio = serviziData.find(s => s.id === servizioId);
        
        const nuovoApp = {
            id: 'app_' + Date.now(),
            clienteNome: nomeCliente,
            clienteTelefono: telCliente,
            clienteEmail: '',
            servizioId: servizioId,
            servizioNome: servizio ? servizio.nome : '',
            barbiereId: barbiereId,
            data: dataStr,
            ora: oraStr,
            stato: 'confermato',
            inseritoDa: 'Admin',
            creatoIl: new Date().toISOString()
        };
        
        await window.FranklinApp.Storage.aggiungiAppuntamento(nuovoApp);
        
        if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
            window.FranklinApp.Admin.mostraToast('Appuntamento salvato in stato Confermato!', 'successo');
        }
        
        chiudiModaleNuovoAppuntamento();
        
        if (window.Agenda && typeof window.Agenda.render === 'function') {
            window.Agenda.render();
        }
        if (window.FranklinApp.Admin && typeof window.FranklinApp.Admin.renderDashboard === 'function') {
            window.FranklinApp.Admin.renderDashboard();
        }
    }

    return {
        apriModaleNuovoAppuntamento,
        chiudiModaleNuovoAppuntamento,
        salvaNuovoAppuntamento,
      totaleOggi: appOggi.length,
      ricaviStimati,
      inAttesa
    };
  },

  async renderDashboard() {
    const kpi = await this.calcolaKPI();
    const kpiContainer = document.getElementById('kpi-container');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="kpi-card"><h3>Appuntamenti Oggi</h3><p>${kpi.totaleOggi}</p></div>
        <div class="kpi-card"><h3>Ricavi Stimati</h3><p>€${kpi.ricaviStimati}</p></div>
        <div class="kpi-card"><h3>In Attesa</h3><p>${kpi.inAttesa}</p></div>
      `;
    }
    await this.renderAppuntamenti('oggi');
  },

  async renderAppuntamenti(filtro = 'tutti') {
    const tbody = document.getElementById('admin-appuntamenti-tbody');
    if (!tbody) return;
    
    let appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
    const oggi = window.FranklinApp.DateHelpers.oggi();
    
    if (filtro === 'oggi') {
      appuntamenti = appuntamenti.filter(a => a.data === oggi);
    }
    
    appuntamenti.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.ora.localeCompare(b.ora);
    });

    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();

    let html = '';
    appuntamenti.forEach(app => {
      const serv = servizi.find(s => s.id === app.servizioId);
      const barb = barbieri.find(b => b.id === app.barbiereId);
      
      const isRichiesta = (app.stato === 'richiesto' || app.stato === 'in_attesa');
      const rowStyle = isRichiesta 
        ? 'background: rgba(215, 145, 20, 0.15); border-left: 4px solid #f57c00;'
        : 'background: rgba(45, 120, 55, 0.15); border-left: 4px solid #4caf50;';
        
      let noteIcon = '';
      if (app.note && app.note.trim() !== '') {
        const escNote = app.note.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        noteIcon = `<span onclick="if(window.Agenda && window.Agenda.mostraNota) window.Agenda.mostraNota('${escNote}'); else alert('Note: ${escNote}');" style="color:#ff3333; font-weight:bold; cursor:pointer; font-size:1.1rem; margin-left:6px;" title="Note cliente: ${escNote}">❗</span>`;
      }
      
      let azioniBtns = '';
      if (isRichiesta) {
        azioniBtns = `
          <button class="btn-primary" style="background:#2e7d32; border-color:#4caf50; padding:4px 8px; font-size:1.05rem;" onclick="window.FranklinApp.Admin.cambiaStatoAppuntamento('${app.id}', 'confermato')" title="Accetta e Conferma">✅</button>
          <button class="btn-danger" style="padding:4px 8px; font-size:1.05rem;" onclick="window.FranklinApp.Admin.cambiaStatoAppuntamento('${app.id}', 'cancellato')" title="Rifiuta e Cancella">❌</button>
        `;
      } else {
        azioniBtns = `
          <button class="btn-secondary" style="padding:4px 8px; font-size:0.95rem;" onclick="if(window.Agenda && window.Agenda.modificaAppuntamento) window.Agenda.modificaAppuntamento('${app.id}');" title="Modifica">✏️</button>
          <button class="btn-danger" style="padding:4px 8px; font-size:0.95rem;" onclick="window.FranklinApp.Admin.eliminaAppuntamento('${app.id}')" title="Elimina">🗑️</button>
        `;
      }
      
      html += `<tr style="${rowStyle}">
        <td>${window.FranklinApp.DateHelpers.formattaDataBreve(app.data)} ${app.ora}</td>
        <td><strong>${app.clienteNome}</strong>${noteIcon}</td>
        <td>${serv ? serv.nome : 'N/A'}</td>
        <td>${barb ? barb.nome : 'N/A'}</td>
        <td>
          <span style="font-weight:bold; color: ${isRichiesta ? '#ffd700' : '#81c784'};">${isRichiesta ? 'Richiesta' : 'Confermato'}</span>
        </td>
        <td style="display:flex; gap:6px;">
          ${azioniBtns}
        </td>
      </tr>`;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="6">Nessun appuntamento</td></tr>';
  },

  async cambiaStatoAppuntamento(id, nuovoStato) {
    await window.FranklinApp.Storage.aggiornaStatoAppuntamento(id, nuovoStato);
    this.mostraToast("Stato aggiornato", "successo");
    await this.renderDashboard();
    if (window.Agenda && typeof window.Agenda.render === 'function') {
      window.Agenda.render();
    }
  },

  async eliminaAppuntamento(id) {
    if (confirm("Sei sicuro di voler eliminare questo appuntamento?")) {
      await window.FranklinApp.Storage.eliminaAppuntamento(id);
      this.mostraToast("Appuntamento eliminato", "successo");
      await this.renderDashboard();
    }
  },

  statoOrdinamentoServizi: { col: 'categoria', dir: 'asc' },
  filtroCategoriaServizi: 'Tutti',

  async impostaFiltroCategoriaServizi(cat) {
    this.filtroCategoriaServizi = cat;
    await this.renderServizi();
  },

  async ordinaServizi(col) {
    if (this.statoOrdinamentoServizi.col === col) {
      this.statoOrdinamentoServizi.dir = this.statoOrdinamentoServizi.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.statoOrdinamentoServizi.col = col;
      this.statoOrdinamentoServizi.dir = 'asc';
    }
    await this.renderServizi();
  },

  async renderServizi() {
    const tbody = document.getElementById('admin-servizi-tbody');
    if (!tbody) return;
    
    let servizi = await window.FranklinApp.Storage.ottieniServizi();
    
    // Popola i bottoni filtro categoria
    const filtriContainer = document.getElementById('servizi-filtri-categoria');
    if (filtriContainer) {
        const categorieSet = new Set(servizi.map(s => s.categoria).filter(c => c));
        const categorie = ['Tutti', ...Array.from(categorieSet).sort()];
        
        filtriContainer.innerHTML = categorie.map(cat => {
            const isActive = this.filtroCategoriaServizi === cat;
            const btnClass = isActive ? 'btn-primary' : 'btn-secondary';
            return `<button class="${btnClass}" style="padding: 0.2rem 0.6rem; font-size: 0.9rem;" onclick="window.FranklinApp.Admin.impostaFiltroCategoriaServizi('${cat}')">${cat}</button>`;
        }).join('');
    }

    // Applica filtro
    if (this.filtroCategoriaServizi !== 'Tutti') {
        servizi = servizi.filter(s => s.categoria === this.filtroCategoriaServizi);
    }

    const { col, dir } = this.statoOrdinamentoServizi;
    
    if (col) {
      servizi.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Aggiorna icone di ordinamento
    ['categoria', 'nome', 'durata', 'prezzo', 'attivo'].forEach(c => {
      const iconSpan = document.getElementById(`sort-icon-${c}`);
      if (iconSpan) {
        if (col === c) {
          iconSpan.innerHTML = dir === 'asc' ? '&nbsp;▲' : '&nbsp;▼';
        } else {
          iconSpan.textContent = '';
        }
      }
    });

    let html = '';
    servizi.forEach(s => {
      const imgPath = window.FranklinApp.Storage.fixImagePath(s.immagine, true);
      const fallbackImg = '../assets/images/hero-bg.jpg';
      const imgHtml = `
        <div style="display: flex; align-items: center; justify-content: center;">
          <img src="${imgPath}" alt="${s.nome}" 
               onerror="this.onerror=null; this.src='${fallbackImg}';"
               style="width: 52px; height: 52px; object-fit: cover; border-radius: var(--border-radius-sm); border: 1.5px solid var(--color-brass-dark); box-shadow: 0 3px 8px rgba(0,0,0,0.5); transition: transform 0.2s ease, border-color 0.2s ease; cursor: pointer;" 
               onmouseover="this.style.transform='scale(1.15)'; this.style.borderColor='var(--color-brass-light)';" 
               onmouseout="this.style.transform='scale(1)'; this.style.borderColor='var(--color-brass-dark)';"
               onclick="window.open('${imgPath}', '_blank')"
               title="Clicca per ingrandire">
        </div>
      `;

      html += `<tr style="${!s.attivo ? 'opacity: 0.6; filter: grayscale(100%);' : ''}">
        <td style="text-transform: capitalize;">${s.categoria}</td>
        <td>${imgHtml}</td>
        <td><strong>${s.nome}</strong></td>
        <td>${s.descrizione || ''}</td>
        <td>${s.durata} min</td>
        <td>€${Number(s.prezzo).toFixed(2)}</td>
        <td>
          <select class="vintage-select" onchange="window.FranklinApp.Admin.cambiaStatoServizio('${s.id}', this.value === 'true')" style="padding: 0.2rem; min-width: 90px; font-size: 0.9rem;">
            <option value="true" ${s.attivo ? 'selected' : ''}>Attivo</option>
            <option value="false" ${!s.attivo ? 'selected' : ''}>Inattivo</option>
          </select>
        </td>
        <td style="white-space: nowrap;">
          <button class="azioni-btn" title="Modifica" onclick="window.FranklinApp.Admin.apriModaleServizio('${s.id}')">✏️</button>
          <button class="azioni-btn" title="Duplica" onclick="window.FranklinApp.Admin.duplicaServizio('${s.id}')">📋</button>
          <button class="azioni-btn btn-danger" title="Elimina" onclick="window.FranklinApp.Admin.eliminaServizio('${s.id}')">🗑️</button>
        </td>
      </tr>`;
    });
    tbody.innerHTML = html;
  },

  async toggleServizio(id) {
    await window.FranklinApp.Storage.toggleServizio(id);
    await this.renderServizi();
    this.mostraToast("Stato servizio aggiornato", "successo");
  },

  async cambiaStatoServizio(id, attivo) {
    await window.FranklinApp.Storage.aggiornaServizio(id, { attivo: attivo });
    await this.renderServizi();
    this.mostraToast("Stato servizio aggiornato", "successo");
  },

  async eliminaServizio(id) {
    if (confirm("Sei sicuro di voler eliminare questo servizio?")) {
      await window.FranklinApp.Storage.eliminaServizio(id);
      await this.renderServizi();
      this.mostraToast("Servizio eliminato", "successo");
    }
  },

  async duplicaServizio(id) {
    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const srv = servizi.find(s => s.id === id);
    if (srv) {
      const nuovoServizio = {
        ...srv,
        id: 'srv_' + Date.now(),
        nome: srv.nome + ' (Copia)'
      };
      await window.FranklinApp.Storage.aggiungiServizio(nuovoServizio);
      await this.renderServizi();
      this.mostraToast("Servizio duplicato con successo", "successo");
    }
  },

  async apriModaleServizio(id = null) {
    if (id) {
        const servizi = await window.FranklinApp.Storage.ottieniServizi();
        const serv = servizi.find(s => s.id === id);
        if (serv) {
            // Se esiste la funzione a livello globale in services.html
            if (typeof apriModaleServizio === 'function') {
                apriModaleServizio(serv);
            }
        }
    } else {
        if (typeof apriModaleServizio === 'function') {
            apriModaleServizio(null);
        }
    }
  },

  async salvaServizio(datiForm) {
    if (datiForm.id) {
      await window.FranklinApp.Storage.aggiornaServizio(datiForm.id, datiForm);
    } else {
      delete datiForm.id; // Non inviare id nullo a Supabase
      await window.FranklinApp.Storage.aggiungiServizio(datiForm);
    }
    await this.renderServizi();
    this.mostraToast("Servizio salvato", "successo");
  },

  async uploadImmagine(file, folder, filename) {
    const { data, error } = await window.FranklinApp.Storage.supabase.storage.from('franklin_assets').upload(folder + '/' + filename, file, { upsert: true });
    if (error) {
        console.error("Errore upload immagine:", error);
        return null;
    }
    const { data: { publicUrl } } = window.FranklinApp.Storage.supabase.storage.from('franklin_assets').getPublicUrl(folder + '/' + filename);
    return publicUrl;
  },

  renderImpostazioni() {
  },

  async salvaOrari(datiOrari) {
    const imp = await window.FranklinApp.Storage.ottieniImpostazioni();
    imp.orariApertura = datiOrari;
    await window.FranklinApp.Storage.salvaImpostazioni(imp);
    this.mostraToast("Orari salvati", "successo");
  },

  esportaBackup() {
    const dati = window.FranklinApp.Storage.esportaTutto();
    const blob = new Blob([dati], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `franklin_backup_${window.FranklinApp.DateHelpers.oggi()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importaBackup(fileContent) {
    if (window.FranklinApp.Storage.importaTutto(fileContent)) {
      this.mostraToast("Backup ripristinato con successo", "successo");
      setTimeout(() => location.reload(), 1000);
    } else {
      this.mostraToast("Errore durante il ripristino", "errore");
    }
  },

  nuovoAppuntamentoManuale() {
    if(window.FranklinApp.Pubblico) {
      window.FranklinApp.Pubblico.apriPrenotazione(); 
    }
  },

  mostraToast(messaggio, tipo) {
    if (window.FranklinApp.Pubblico && window.FranklinApp.Pubblico.mostraToast) {
      window.FranklinApp.Pubblico.mostraToast(messaggio, tipo);
    } else {
      // Fallback custom toast per admin se public non  caricato
      let container = document.getElementById('toast-container');
      if (!container) {
          container = document.createElement('div');
          container.id = 'toast-container';
          container.style.position = 'fixed';
          container.style.bottom = '20px';
          container.style.right = '20px';
          container.style.zIndex = '9999';
          document.body.appendChild(container);
      }
      
      const toast = document.createElement('div');
      toast.className = `toast-notification`;
      toast.innerText = messaggio;
      toast.style.borderColor = 'var(--color-brass-base)';
      if (tipo === 'successo') {
        toast.style.backgroundColor = 'var(--color-green-100)';
      } else {
        toast.style.backgroundColor = 'var(--color-danger)';
      }
      
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  },

  async apriModaleNuovoAppuntamento() {
        const modal = document.getElementById('modale-nuovo-appuntamento');
        if (!modal) return;
        
        // Reset modifica e titolo
        delete modal.dataset.editingId;
        const titoloModale = modal.querySelector('h3, .vintage-title');
        if (titoloModale) titoloModale.textContent = 'Inserisci Appuntamento';
        
        const nomeInput = document.getElementById('nuovo-appuntamento-cliente');
        const telInput = document.getElementById('nuovo-appuntamento-telefono');
        if (nomeInput) nomeInput.value = '';
        if (telInput) telInput.value = '';

        // Popola Servizi
        const selectServizio = document.getElementById('nuovo-appuntamento-servizio');
        if (selectServizio) {
            selectServizio.innerHTML = '<option value="">Seleziona un servizio...</option>';
            const servizi = await window.FranklinApp.Storage.ottieniServizi();
            servizi.forEach(s => {
                if (s.attivo) {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = `${s.nome} (${s.durata} min - €${s.prezzo})`;
                    selectServizio.appendChild(opt);
                }
            });
            selectServizio.value = "";
            selectServizio.disabled = false;
        }
        
        // Popola Barbieri
        const selectBarbiere = document.getElementById('nuovo-appuntamento-barbiere');
        if (selectBarbiere) {
            selectBarbiere.innerHTML = '<option value="">Seleziona prima il servizio...</option>';
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();
            barbieri.forEach(b => {
                if (b.attivo !== false) {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.nome;
                    selectBarbiere.appendChild(opt);
                }
            });
            selectBarbiere.value = "";
            selectBarbiere.disabled = true;
        }
        
        // Imposta data di default (Oggi)
        const dateInput = document.getElementById('nuovo-appuntamento-data');
        const todayStr = window.FranklinApp.DateHelpers.oggi();
        if (dateInput) {
            dateInput.value = todayStr;
            dateInput.min = todayStr;
            dateInput.disabled = true;
        }
        
        // Pulisce il selettore dell'ora
        const selectOra = document.getElementById('nuovo-appuntamento-ora');
        if (selectOra) {
            selectOra.innerHTML = '<option value="">Seleziona prima i campi precedenti...</option>';
            selectOra.value = "";
            selectOra.disabled = true;
        }
        
        modal.style.display = 'flex';
  },
  

  async ricalcolaOrari() {
        const selectServizio = document.getElementById('nuovo-appuntamento-servizio');
        const selectBarbiere = document.getElementById('nuovo-appuntamento-barbiere');
        const dateInput = document.getElementById('nuovo-appuntamento-data');
        const selectOra = document.getElementById('nuovo-appuntamento-ora');
        
        const servizioId = selectServizio.value;
        const barbiereId = selectBarbiere.value;
        const dataStr = dateInput.value;
        
        // Logica Sequenziale
        if (!servizioId) {
            selectBarbiere.disabled = true;
            selectBarbiere.value = "";
            dateInput.disabled = true;
            selectOra.disabled = true;
            selectOra.innerHTML = '<option value="">Seleziona prima il servizio...</option>';
            return;
        } else {
            selectBarbiere.disabled = false;
        }
        
        if (!barbiereId) {
            dateInput.disabled = true;
            selectOra.disabled = true;
            selectOra.innerHTML = '<option value="">Seleziona prima il barbiere...</option>';
            return;
        } else {
            dateInput.disabled = false;
        }
        
        selectOra.innerHTML = '<option value="">Caricamento orari...</option>';
        selectOra.disabled = true;
        
        if (!dataStr) {
            selectOra.innerHTML = '<option value="">Seleziona una data valida</option>';
            return;
        }
        
        if (dataStr < window.FranklinApp.DateHelpers.oggi()) {
            if (window.FranklinApp && window.FranklinApp.Admin) {
                window.FranklinApp.Admin.mostraToast("Non puoi prenotare in una data passata", "errore");
            }
            selectOra.innerHTML = '<option value="">Data passata</option>';
            return;
        }

        const dataSel = new Date(dataStr);
        const giorni = ['domenica','lunedi','martedi','mercoledi','giovedi','venerdi','sabato'];
        const giornoStr = giorni[dataSel.getDay()];
        
        const imp = await window.FranklinApp.Storage.ottieniImpostazioni();
        const orariNegozio = (imp.orariLavoro && imp.orariLavoro[giornoStr]) ? imp.orariLavoro[giornoStr] : null;
        
        // 1. Controllo Chiusura Negozio (giorno intero)
        if (!orariNegozio || orariNegozio.chiuso) {
            this.mostraToast("Negozio chiuso in questa giornata", "errore");
            selectOra.innerHTML = '<option value="">Negozio chiuso</option>';
            return;
        }
        
        // 2. Controllo Eccezioni Negozio (giorno intero)
        if (imp.giorniEccezionali) {
            const eccNegozio = imp.giorniEccezionali.find(e => e.data === dataStr && e.interaGiornata);
            if (eccNegozio) {
                this.mostraToast("Chiusura eccezionale: " + eccNegozio.motivo, "errore");
                selectOra.innerHTML = '<option value="">Negozio chiuso</option>';
                return;
            }
        }
        
        // 3. Controllo Eccezioni Barbiere (giorno intero)
        let eccBarbiere = null;
        if (barbiereId) {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();
            const b = barbieri.find(x => x.id === barbiereId);
            if (b && b.giorniEccezionali) {
                eccBarbiere = b.giorniEccezionali.find(e => e.data === dataStr);
                if (eccBarbiere && eccBarbiere.interaGiornata) {
                    this.mostraToast("Il barbiere selezionato è assente in questa data", "errore");
                    selectOra.innerHTML = '<option value="">Barbiere assente</option>';
                    return;
                }
            }
        }



        const servizi = await window.FranklinApp.Storage.ottieniServizi();
        const servizio = servizi.find(s => s.id === servizioId);
        if (!servizio) return;
        const durataMinuti = parseInt(servizio.durata);

        // Funzione helper per generare orari a step di 15 min
        const generaSlot = (inizioStr, fineStr) => {
            if (!inizioStr || !fineStr) return [];
            let slot = [];
            let [hI, mI] = inizioStr.split(':').map(Number);
            let [hF, mF] = fineStr.split(':').map(Number);
            let dI = new Date(); dI.setHours(hI, mI, 0, 0);
            let dF = new Date(); dF.setHours(hF, mF, 0, 0);
            
            while (dI < dF) {
                let h = dI.getHours().toString().padStart(2, '0');
                let m = dI.getMinutes().toString().padStart(2, '0');
                slot.push(`${h}:${m}`);
                dI.setMinutes(dI.getMinutes() + 15); // Step di 15 min
            }
            return slot;
        };

        // Genera tutti gli slot della giornata
        let slotMattina = [];
        if (orariNegozio.orarioMattina && orariNegozio.orarioMattina.includes('-')) {
            const parts = orariNegozio.orarioMattina.split('-');
            slotMattina = generaSlot(parts[0], parts[1]);
        }
        
        let slotPomeriggio = [];
        if (orariNegozio.orarioPomeriggio && orariNegozio.orarioPomeriggio.includes('-')) {
            const parts = orariNegozio.orarioPomeriggio.split('-');
            slotPomeriggio = generaSlot(parts[0], parts[1]);
        }
        
        let tuttiSlot = [...slotMattina, ...slotPomeriggio];
        
        // Filtra in base agli imprevisti parziali
        const isTimeInException = (time, exc) => {
            if (!exc || exc.interaGiornata || !exc.dalle || !exc.alle) return false;
            return time >= exc.dalle && time < exc.alle;
        };

        const eccNegozioParziale = imp.giorniEccezionali ? imp.giorniEccezionali.find(e => e.data === dataStr && !e.interaGiornata) : null;
        
        tuttiSlot = tuttiSlot.filter(t => !isTimeInException(t, eccNegozioParziale) && !isTimeInException(t, eccBarbiere));

        // 4. Sottrai appuntamenti esistenti (verificando la durata e l'overlap)
        // Se siamo in modalità modifica, escludiamo l'appuntamento corrente dal calcolo overlap
        const modalRef = document.getElementById('modale-nuovo-appuntamento');
        const editingId = modalRef ? modalRef.dataset.editingId : null;
        const appuntamentiData = await window.FranklinApp.Storage.ottieniAppuntamenti();
        const appuntamenti = appuntamentiData.filter(a => a.data === dataStr && a.barbiereId === barbiereId && a.stato !== 'cancellato' && a.id !== editingId);
        
        const isOverlap = (newStart, newDuration, existingStart, existingDuration) => {
            const [nsH, nsM] = newStart.split(':').map(Number);
            const [esH, esM] = existingStart.split(':').map(Number);
            const nsMins = nsH * 60 + nsM;
            const esMins = esH * 60 + esM;
            
            return (nsMins < (esMins + existingDuration)) && ((nsMins + newDuration) > esMins);
        };

        const isOut = (newStart, newDuration) => {
             const [nsH, nsM] = newStart.split(':').map(Number);
             const nsMins = nsH * 60 + nsM;
             const endMins = nsMins + newDuration;
             
             // Controllo che non sfori la chiusura del mattino (se inizia al mattino)
             if (orariNegozio.mattinaChiusura) {
                 const [mChH, mChM] = orariNegozio.mattinaChiusura.split(':').map(Number);
                 const mChMins = mChH * 60 + mChM;
                 if (nsMins < mChMins && endMins > mChMins) return true;
             }
             
             // Controllo che non sfori la chiusura del pomeriggio
             if (orariNegozio.pomeriggioChiusura) {
                 const [pChH, pChM] = orariNegozio.pomeriggioChiusura.split(':').map(Number);
                 const pChMins = pChH * 60 + pChM;
                 if (endMins > pChMins) return true;
             }
             return false;
        };

        const slotDisponibili = tuttiSlot.filter(slot => {
            // Controlla se sfora l'orario di lavoro
            if (isOut(slot, durataMinuti)) return false;
            
            // Controlla overlap con altri appuntamenti
            for (let a of appuntamenti) {
                const srv = servizi.find(s => s.id === a.servizioId);
                const exDurata = srv ? parseInt(srv.durata) : 30; // fallback
                if (isOverlap(slot, durataMinuti, a.ora, exDurata)) return false;
            }
            return true;
        });

        selectOra.innerHTML = '';
        if (slotDisponibili.length === 0) {
            selectOra.innerHTML = '<option value="">Nessun orario disponibile</option>';
        } else {
            selectOra.innerHTML = '<option value="">Seleziona orario...</option>';
            slotDisponibili.forEach(slot => {
                const opt = document.createElement('option');
                opt.value = slot;
                opt.textContent = slot;
                selectOra.appendChild(opt);
            });
            selectOra.disabled = false;
        }
  },

  chiudiModaleNuovoAppuntamento() {
        const modal = document.getElementById('modale-nuovo-appuntamento');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('form-nuovo-appuntamento').reset();
            // Puliamo lo stato di modifica
            delete modal.dataset.editingId;
            // Ripristiniamo il titolo originale
            const titoloModale = modal.querySelector('h2, .vintage-title');
            if (titoloModale) titoloModale.textContent = 'Nuovo Appuntamento';
        }
  },
  
  async salvaNuovoAppuntamento(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        
        const servizioId = document.getElementById('nuovo-appuntamento-servizio').value;
        const barbiereId = document.getElementById('nuovo-appuntamento-barbiere').value;
        const dataStr = document.getElementById('nuovo-appuntamento-data').value;
        const oraStr = document.getElementById('nuovo-appuntamento-ora').value;
        const nomeCliente = document.getElementById('nuovo-appuntamento-cliente').value;
        const telCliente = document.getElementById('nuovo-appuntamento-telefono').value;
        
        const servizi = await window.FranklinApp.Storage.ottieniServizi();
        const servizio = servizi.find(s => s.id === servizioId);
        
        // Controlliamo se siamo in modalità modifica
        const modal = document.getElementById('modale-nuovo-appuntamento');
        const editingId = modal ? modal.dataset.editingId : null;
        
        if (editingId) {
            // MODIFICA: aggiorniamo l'appuntamento esistente
            const appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
            const appIndex = appuntamenti.findIndex(a => a.id === editingId);
            if (appIndex > -1) {
                appuntamenti[appIndex].servizioId = servizioId;
                appuntamenti[appIndex].servizioNome = servizio ? servizio.nome : 'Sconosciuto';
                appuntamenti[appIndex].barbiereId = barbiereId;
                appuntamenti[appIndex].data = dataStr;
                appuntamenti[appIndex].ora = oraStr;
                appuntamenti[appIndex].clienteNome = nomeCliente;
                appuntamenti[appIndex].clienteTelefono = telCliente;
                await window.FranklinApp.Storage.salvaAppuntamenti(appuntamenti);
                this.mostraToast('Appuntamento modificato con successo!', 'successo');
            }
            // Puliamo l'attributo di modifica
            delete modal.dataset.editingId;
        } else {
            // NUOVO: creiamo un nuovo appuntamento
            const nuovoApp = {
                id: 'app_' + Date.now(),
                clienteNome: nomeCliente,
                clienteTelefono: telCliente,
                servizioId: servizioId,
                servizioNome: servizio ? servizio.nome : 'Sconosciuto',
                barbiereId: barbiereId,
                data: dataStr,
                ora: oraStr,
                stato: document.getElementById('nuovo-appuntamento-stato') ? document.getElementById('nuovo-appuntamento-stato').value : 'confermato',
                creatoIl: new Date().toISOString(),
                inseritoDa: (() => {
                    const u = window.FranklinApp.Auth.getUtenteLoggato();
                    return u ? `${u.nome || ''} ${u.cognome || ''}`.trim() || u.username : 'Admin';
                })()
            };
            
            await window.FranklinApp.Storage.aggiungiAppuntamento(nuovoApp);
            this.mostraToast('Appuntamento salvato con successo!', 'successo');
        }
        
        this.chiudiModaleNuovoAppuntamento();
        
        if (window.Agenda && typeof window.Agenda.render === 'function') {
            window.Agenda.render();
        }
  }
};
