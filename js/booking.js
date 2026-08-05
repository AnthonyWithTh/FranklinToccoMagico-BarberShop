window.FranklinApp = window.FranklinApp || {};

FranklinApp.Prenotazione = {
  stato: {
    step: 1,
    categoriaFiltro: 'tutti',
    servizioId: null,
    barbiereId: null,
    data: null,
    ora: null,
    clienteNome: '',
    clienteTelefono: '',
    clienteEmail: '',
    note: '',
    adminMode: false
  },

  async inizializza() {
    this.reset();
    await this.renderStep(1);
    this.aggiornaProgressIndicator();
  },

  aggiornaProgressIndicator() {
    const indicator = document.getElementById('booking-progress');
    if (indicator) {
      const titoliStep = [
        'Passo 1: Selezione Servizio',
        'Passo 2: Selezione Barbiere',
        'Passo 3: Data e Ora',
        'Passo 4: Riepilogo e Dati Cliente'
      ];
      indicator.innerText = `${titoliStep[this.stato.step - 1]} (${this.stato.step}/4)`;
    }
  },

  async renderStep(stepNumber) {
    this.stato.step = stepNumber;
    this.aggiornaProgressIndicator();
    
    const container = document.getElementById('booking-step-content');
    if (!container) return;
    
    container.innerHTML = '';

    switch(stepNumber) {
      case 1: await this.renderServizi(container); break;
      case 2: await this.renderBarbieri(container); break;
      case 3: await this.renderDataOra(container); break;
      case 4: await this.renderRiepilogoDati(container); break;
    }
    this.gestisciPulsantiNavigazione();
  },

  async filtraServizi(cat) {
    this.stato.categoriaFiltro = cat;
    const container = document.getElementById('booking-step-content');
    if (container && this.stato.step === 1) {
      await this.renderServizi(container);
    }
  },

  async renderServizi(container) {
    const serviziData = await window.FranklinApp.Storage.ottieniServizi();
    const tuttiServizi = serviziData.filter(s => s.attivo !== false);
    const catSelezionata = this.stato.categoriaFiltro || 'tutti';

    let serviziFiltrati = tuttiServizi;
    if (catSelezionata !== 'tutti') {
      serviziFiltrati = tuttiServizi.filter(s => 
        (s.categoria || '').toLowerCase().includes(catSelezionata.toLowerCase())
      );
    }

    let html = `
      <div style="position: sticky; top: 0; z-index: 10; background: var(--color-black-100); padding-bottom: 0.8rem; margin-bottom: 0.5rem; text-align: left;">
        <label class="vintage-label" style="display: block; font-size: 0.88rem; margin-bottom: 0.6rem; color: var(--color-text-cream);">
          Filtra per Categoria
        </label>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding-bottom: 0.2rem;">
          <button type="button" onclick="FranklinApp.Prenotazione.filtraServizi('tutti')" 
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px; border: 1px solid var(--color-brass-dark); cursor: pointer; transition: all 0.2s; ${catSelezionata === 'tutti' ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light);' : 'background: rgba(0,0,0,0.4); color: var(--color-text-cream);'}">
            Tutti
          </button>
          <button type="button" onclick="FranklinApp.Prenotazione.filtraServizi('capelli')" 
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px; border: 1px solid var(--color-brass-dark); cursor: pointer; transition: all 0.2s; ${catSelezionata === 'capelli' ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light);' : 'background: rgba(0,0,0,0.4); color: var(--color-text-cream);'}">
            Capelli
          </button>
          <button type="button" onclick="FranklinApp.Prenotazione.filtraServizi('barba')" 
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px; border: 1px solid var(--color-brass-dark); cursor: pointer; transition: all 0.2s; ${catSelezionata === 'barba' ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light);' : 'background: rgba(0,0,0,0.4); color: var(--color-text-cream);'}">
            Barba
          </button>
          <button type="button" onclick="FranklinApp.Prenotazione.filtraServizi('trattamenti')" 
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px; border: 1px solid var(--color-brass-dark); cursor: pointer; transition: all 0.2s; ${catSelezionata === 'trattamenti' ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light);' : 'background: rgba(0,0,0,0.4); color: var(--color-text-cream);'}">
            Trattamenti
          </button>
          <button type="button" onclick="FranklinApp.Prenotazione.filtraServizi('combo')" 
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px; border: 1px solid var(--color-brass-dark); cursor: pointer; transition: all 0.2s; ${catSelezionata === 'combo' ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light);' : 'background: rgba(0,0,0,0.4); color: var(--color-text-cream);'}">
            Combo
          </button>
        </div>
      </div>
    `;

    html += '<div class="servizio-selector" style="display: grid; gap: 0.8rem; padding-right: 4px;">';
    
    if (serviziFiltrati.length === 0) {
      html += '<p style="color: var(--color-text-muted); text-align: center; padding: 1.5rem;">Nessun servizio disponibile per questa categoria.</p>';
    } else {
      serviziFiltrati.forEach(s => {
        const isSelected = this.stato.servizioId === s.id;
        const selectedClass = isSelected ? 'selected' : '';
        const borderStyle = isSelected ? 'border: 2px solid var(--color-brass-light); box-shadow: 0 0 15px rgba(197,160,89,0.3);' : 'border: 1px solid var(--color-brass-dark);';
        
        const rawImg = s.immagine || 'assets/images/hero-bg.jpg';
        const bgImg = window.FranklinApp.Storage.fixImagePath(rawImg, false);
        const bgStyle = `background-image: linear-gradient(rgba(18, 18, 18, 0.84), rgba(18, 18, 18, 0.94)), url('${bgImg}'); background-size: cover; background-position: center;`;

        html += `
          <div class="vintage-card selectable-item ${selectedClass}" 
               style="padding: 1.1rem; cursor: pointer; border-radius: var(--border-radius-sm); transition: all 0.2s ease; ${bgStyle} ${borderStyle}"
               onclick="FranklinApp.Prenotazione.selezionaServizio('${s.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <h4 style="margin: 0; font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.1rem;">${s.nome}</h4>
              <span style="font-family: var(--font-admin); font-size: 0.75rem; text-transform: uppercase; color: var(--color-brass-base); letter-spacing: 0.05em; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(197,160,89,0.3);">${s.categoria || 'Servizio'}</span>
            </div>
            <p style="margin: 0 0 0.6rem 0; font-size: 0.85rem; color: var(--color-text-cream); line-height: 1.35;">${s.descrizione || ''}</p>
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 600; color: var(--color-brass-light);">
              <span>⏱️ ${s.durata} min</span>
              <span>€${Number(s.prezzo).toFixed(2)}</span>
            </div>
          </div>
        `;
      });
    }

    html += '</div>';
    container.innerHTML = html;
  },

  selezionaServizio(id) {
    this.stato.servizioId = id;
    this.avanti();
  },

  async renderBarbieri(container) {
    const barbieriData = await window.FranklinApp.Storage.ottieniBarbieri();
    const barbieri = barbieriData.filter(b => b.attivo !== false);
    let html = '<div class="barbiere-selector" style="display: grid; gap: 1.2rem; padding-right: 4px;">';

    barbieri.forEach(b => {
      let n = b.nome || '';
      let c = b.cognome || '';
      if (!c && n.includes(' ')) {
        const parti = n.split(' ');
        n = parti[0];
        c = parti.slice(1).join(' ');
      }
      const nomeCompleto = (n + ' ' + c).trim();
      const fotoUrl = (b.foto && b.foto.trim()) ? b.foto : (b.ritratto && b.ritratto.trim()) ? b.ritratto : 'assets/images/barbiere-marco.jpg';
      const bgImg = window.FranklinApp.Storage.fixImagePath(fotoUrl, false);
      const bgStyle = `background-image: linear-gradient(rgba(18, 18, 18, 0.72), rgba(18, 18, 18, 0.90)), url('${bgImg}'); background-size: cover; background-position: center;`;

      const isSelected = this.stato.barbiereId === b.id;
      const selectedClass = isSelected ? 'selected' : '';
      const borderStyle = isSelected ? 'border: 2px solid var(--color-brass-light); box-shadow: 0 0 20px rgba(197,160,89,0.5);' : 'border: 1px solid var(--color-brass-dark);';

      html += `
        <div class="vintage-card selectable-item ${selectedClass}" 
             style="min-height: 250px; padding: 3rem 1.5rem; cursor: pointer; border-radius: var(--border-radius-sm); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; transition: all 0.25 ease; ${bgStyle} ${borderStyle}"
             onclick="FranklinApp.Prenotazione.selezionaBarbiere('${b.id}')">
          <h4 style="margin: 0 0 10px 0; font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.5rem; text-shadow: 0 3px 12px rgba(0,0,0,0.95);">${nomeCompleto}</h4>
          <div style="font-family: var(--font-admin); font-size: 0.88rem; text-transform: uppercase; color: var(--color-brass-base); letter-spacing: 0.1em; font-weight: bold; background: rgba(0,0,0,0.65); padding: 6px 18px; border-radius: 14px; border: 1px solid rgba(197,160,89,0.4); backdrop-filter: blur(4px);">${b.ruolo || 'Barbiere'}</div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  selezionaBarbiere(id) {
    this.stato.barbiereId = id;
    this.avanti();
  },

  async renderDataOra(container) {
    if (!this.stato.data) {
        this.stato.data = window.FranklinApp.DateHelpers.oggi();
    }
    let html = `
      <div style="margin-bottom: 1.2rem; text-align: left;">
        <label class="vintage-label" style="display: block; font-size: 0.88rem; margin-bottom: 0.4rem; color: var(--color-text-cream);">
          Seleziona la Data *
        </label>
        <input type="date" id="booking-date" class="vintage-input" style="width: 100%; padding: 0.7rem; font-size: 1rem; color-scheme: dark;"
               min="${window.FranklinApp.DateHelpers.oggi()}" 
               value="${this.stato.data}" 
               onchange="FranklinApp.Prenotazione.caricaSlot()">
      </div>
      <div style="text-align: left;">
        <label class="vintage-label" style="display: block; font-size: 0.88rem; margin-bottom: 0.4rem; color: var(--color-text-cream);">
          Orari Disponibili *
        </label>
        <div id="slots-container" class="slots-container" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 6px 0;"></div>
      </div>
    `;
    container.innerHTML = html;
    
    if (this.stato.data) {
      await this.caricaSlot();
    }
  },

  async caricaSlot() {
    const dateInput = document.getElementById('booking-date');
    if (!dateInput) return;
    this.stato.data = dateInput.value;
    
    const slotsContainer = document.getElementById('slots-container');
    if (!slotsContainer) return;

    if (!this.stato.data) {
      slotsContainer.innerHTML = '<p style="color: var(--color-text-muted); padding: 0.8rem 0;">Seleziona prima una data nel calendario qui sopra.</p>';
      return;
    }

    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const servizio = servizi.find(s => s.id === this.stato.servizioId);
    if (!servizio) return;
    
    const slotDisponibili = await window.FranklinApp.DateHelpers.ottieniSlotDisponibili(this.stato.data, servizio.durata, this.stato.barbiereId);
    
    if (slotDisponibili.length === 0) {
      slotsContainer.innerHTML = '<p style="color: var(--color-danger); background: rgba(180, 40, 40, 0.15); border: 1px solid var(--color-danger); padding: 0.8rem; border-radius: 6px; font-size: 0.9rem; margin-top: 0.3rem;">⚠️ Nessun orario disponibile per questa data.<br><span style="font-size: 0.82rem; color: var(--color-text-cream);">Il salone potrebbe essere chiuso, festivo, o il barbiere non disponibile (ferie, permessi, imprevisti). Scegli un\'altra data.</span></p>';
      return;
    }
    
    const slotMattina = slotDisponibili.filter(ora => ora < '14:00');
    const slotPomeriggio = slotDisponibili.filter(ora => ora >= '14:00');
    
    let html = '';
    
    const renderButtons = (slots) => {
      let btns = '';
      slots.forEach(ora => {
        const isSelected = this.stato.ora === ora;
        const btnStyle = isSelected 
          ? 'background: var(--color-brass-base); color: var(--color-black-100); font-weight: bold; border-color: var(--color-brass-light); box-shadow: 0 0 10px rgba(197,160,89,0.5);'
          : 'background: rgba(18,18,18,0.7); color: var(--color-text-cream); border: 1px solid var(--color-brass-dark);';
        btns += `<button type="button" class="orario-slot" data-ora="${ora}" style="padding: 8px 14px; border-radius: 6px; font-size: 0.92rem; cursor: pointer; transition: all 0.2s ease; margin: 4px; ${btnStyle}" onclick="FranklinApp.Prenotazione.selezionaOra('${ora}', this)">${ora}</button>`;
      });
      return btns;
    };

    if (slotMattina.length > 0) {
      html += `<div style="width: 100%; margin-bottom: 1rem;">
        <h5 style="color: var(--color-brass-base); margin: 0 0 8px 0; font-family: var(--font-admin); font-size: 0.9rem; border-bottom: 1px solid rgba(197,160,89,0.3); padding-bottom: 4px;">Mattina</h5>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${renderButtons(slotMattina)}</div>
      </div>`;
    }
    
    if (slotPomeriggio.length > 0) {
      html += `<div style="width: 100%;">
        <h5 style="color: var(--color-brass-base); margin: 0 0 8px 0; font-family: var(--font-admin); font-size: 0.9rem; border-bottom: 1px solid rgba(197,160,89,0.3); padding-bottom: 4px;">Pomeriggio</h5>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${renderButtons(slotPomeriggio)}</div>
      </div>`;
    }

    slotsContainer.innerHTML = html;
    this.gestisciPulsantiNavigazione();
  },

  selezionaOra(ora, btnElement) {
    this.stato.ora = ora;
    
    // Rimuovi stile attivo da tutti gli slot
    const tuttiSlot = document.querySelectorAll('.orario-slot');
    tuttiSlot.forEach(btn => {
      btn.style.background = 'rgba(18,18,18,0.7)';
      btn.style.color = 'var(--color-text-cream)';
      btn.style.fontWeight = 'normal';
      btn.style.borderColor = 'var(--color-brass-dark)';
      btn.style.boxShadow = 'none';
    });
    
    // Aggiungi stile attivo al bottone cliccato
    if (btnElement) {
      btnElement.style.background = 'var(--color-brass-base)';
      btnElement.style.color = 'var(--color-black-100)';
      btnElement.style.fontWeight = 'bold';
      btnElement.style.borderColor = 'var(--color-brass-light)';
      btnElement.style.boxShadow = '0 0 10px rgba(197,160,89,0.5)';
    }

    this.gestisciPulsantiNavigazione();
  },

  async renderRiepilogoDati(container) {
    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const servizio = servizi.find(s => s.id === this.stato.servizioId);
    const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();
    const barbiere = barbieri.find(b => b.id === this.stato.barbiereId);
    
    let barbNome = barbiere ? (barbiere.nome + (barbiere.cognome ? ' ' + barbiere.cognome : '')) : '';

    let html = `
      <div class="booking-riepilogo vintage-card" style="padding: 1rem; margin-bottom: 1.2rem; background: rgba(0,0,0,0.3); border: 1px solid var(--color-brass-dark); border-radius: var(--border-radius-sm); font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div><strong style="color: var(--color-brass-light);">Servizio:</strong> ${servizio ? servizio.nome : '-'}</div>
          <div><strong style="color: var(--color-brass-light);">Barbiere:</strong> ${barbNome || '-'}</div>
          <div><strong style="color: var(--color-brass-light);">Data:</strong> ${this.stato.data ? window.FranklinApp.DateHelpers.formattaData(this.stato.data) : '-'}</div>
          <div><strong style="color: var(--color-brass-light);">Ora:</strong> ${this.stato.ora || '-'}</div>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.9rem; text-align: left;">
        <div style="display: flex; gap: 0.9rem;">
          <div style="flex: 1;">
            <label class="vintage-label" style="display: block; font-size: 0.82rem; margin-bottom: 0.3rem;">Nome e Cognome *</label>
            <input type="text" id="booking-nome" class="vintage-input" placeholder="es. Mario Rossi" value="${this.stato.clienteNome}" style="width: 100%;">
          </div>
          <div style="flex: 1;">
            <label class="vintage-label" style="display: block; font-size: 0.82rem; margin-bottom: 0.3rem;">Telefono *</label>
            <input type="tel" id="booking-tel" class="vintage-input" placeholder="es. 3331234567" value="${this.stato.clienteTelefono}" style="width: 100%;">
          </div>
        </div>
        <div>
          <label class="vintage-label" style="display: block; font-size: 0.82rem; margin-bottom: 0.3rem;">Note Aggiuntive</label>
          <textarea id="booking-note" class="vintage-textarea" rows="2" placeholder="Eventuali preferenze o dettagli..." style="width: 100%;">${this.stato.note}</textarea>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },

  gestisciPulsantiNavigazione() {
    const btnIndietro = document.getElementById('btn-booking-indietro');
    const btnAvanti = document.getElementById('btn-booking-avanti');
    const btnConferma = document.getElementById('btn-booking-conferma');
    
    if (btnIndietro) btnIndietro.style.display = this.stato.step > 1 ? 'block' : 'none';
    if (btnAvanti) btnAvanti.style.display = this.stato.step < 4 ? 'block' : 'none';
    if (btnConferma) btnConferma.style.display = this.stato.step === 4 ? 'block' : 'none';
  },

  async avanti() {
    if (this.stato.step === 1 && !this.stato.servizioId) {
      if (window.FranklinApp.Pubblico) window.FranklinApp.Pubblico.mostraToast("Seleziona un servizio prima di proseguire", "errore");
      return;
    }
    if (this.stato.step === 2 && !this.stato.barbiereId) {
      if (window.FranklinApp.Pubblico) window.FranklinApp.Pubblico.mostraToast("Seleziona un barbiere prima di proseguire", "errore");
      return;
    }
    if (this.stato.step === 3 && (!this.stato.data || !this.stato.ora)) {
      if (window.FranklinApp.Pubblico) window.FranklinApp.Pubblico.mostraToast("Seleziona data e ora dell'appuntamento", "errore");
      return;
    }
    
    if (this.stato.step < 4) {
      await this.renderStep(this.stato.step + 1);
    }
  },

  async indietro() {
    if (this.stato.step > 1) {
      await this.renderStep(this.stato.step - 1);
    }
  },

  async conferma() {
    const inNome = document.getElementById('booking-nome');
    const inTel = document.getElementById('booking-tel');
    const inNote = document.getElementById('booking-note');
    
    this.stato.clienteNome = inNome ? inNome.value.trim() : '';
    this.stato.clienteTelefono = inTel ? inTel.value.trim() : '';
    this.stato.clienteEmail = '';
    this.stato.note = inNote ? inNote.value.trim() : '';
    
    const val = window.FranklinApp.Validatori.validaPrenotazione(this.stato);
    
    if (!val.valido) {
      const toastFn = (window.FranklinApp.Pubblico && window.FranklinApp.Pubblico.mostraToast)
        ? window.FranklinApp.Pubblico.mostraToast.bind(window.FranklinApp.Pubblico)
        : (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast)
          ? window.FranklinApp.Admin.mostraToast.bind(window.FranklinApp.Admin)
          : null;
      if (toastFn) toastFn(val.messaggio, "errore");
      else alert(val.messaggio);
      return;
    }
    
    const isAdmin = this.stato.adminMode;
    let utenteLoggato = null;
    let nomeAdmin = 'Admin';
    
    if (isAdmin && window.FranklinApp.Auth) {
      utenteLoggato = await window.FranklinApp.Auth.getUtenteLoggato();
      if (utenteLoggato) {
        nomeAdmin = `${utenteLoggato.nome || ''} ${utenteLoggato.cognome || ''}`.trim() || utenteLoggato.username || 'Admin';
      }
    }
    
    // Recuperiamo il servizio per storicizzarlo
    const servizi = await window.FranklinApp.Storage.ottieniServizi();
    const servizioObj = servizi.find(s => s.id === this.stato.servizioId);
    
    const nuovoApp = {
      clienteNome: this.stato.clienteNome,
      clienteTelefono: this.stato.clienteTelefono,
      data: this.stato.data,
      ora: this.stato.ora,
      barbiereId: this.stato.barbiereId,
      servizioNome: servizioObj ? servizioObj.nome : 'Servizio Sconosciuto',
      servizioDurata: servizioObj ? servizioObj.durata : 30,
      servizioCosto: servizioObj ? servizioObj.prezzo : 0,
      stato: isAdmin ? 'Confermato' : 'Richiesto',
      note: this.stato.note,
      inseritoDa: isAdmin ? nomeAdmin : 'Cliente',
      confermatoDa: isAdmin ? nomeAdmin : null
    };
    
    await window.FranklinApp.Storage.aggiungiAppuntamento(nuovoApp);
    
    const msg = isAdmin ? 'Appuntamento confermato con successo!' : 'Richiesta di prenotazione inviata.';
    
    if (isAdmin) {
      // Admin mode: close modal and refresh agenda
      if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
        window.FranklinApp.Admin.mostraToast(msg, 'successo');
      }
      this.chiudiModaleAdmin();
      if (window.Agenda && typeof window.Agenda.render === 'function') window.Agenda.render();
    } else {
      // Client mode
      if (window.FranklinApp.Pubblico) {
        window.FranklinApp.Pubblico.mostraToast(msg, 'successo');
        window.FranklinApp.Pubblico.chiudiPrenotazione();
      } else {
        alert(msg);
      }
    }
    
    this.reset();
  },

  // Apri modale prenotazione in modalità admin
  async apriModaleAdmin() {
    this.reset();
    this.stato.adminMode = true;
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Cambia il titolo per il contesto admin
      const titolo = modal.querySelector('.vintage-title');
      if (titolo) titolo.textContent = 'Nuovo Appuntamento';
      await this.renderStep(1);
      this.aggiornaProgressIndicator();
    }
  },

  chiudiModaleAdmin() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.reset();
  },

  reset() {
    this.stato = {
      step: 1,
      categoriaFiltro: 'tutti',
      servizioId: null,
      barbiereId: null,
      data: null,
      ora: null,
      clienteNome: '',
      clienteTelefono: '',
      clienteEmail: '',
      note: '',
      adminMode: false
    };
  }
};
