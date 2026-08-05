window.FranklinApp = window.FranklinApp || {};

FranklinApp.Validatori = {
  validaNome(nome) {
    if (!nome || nome.trim().length < 2) {
      return { valido: false, messaggio: "Il nome deve contenere almeno 2 caratteri" };
    }
    return { valido: true, messaggio: "" };
  },
  
  validaTelefono(telefono) {
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!telefono || !regex.test(telefono.replace(/\s+/g, ''))) {
      return { valido: false, messaggio: "Inserire un numero di telefono valido" };
    }
    return { valido: true, messaggio: "" };
  },

  validaEmail(email) {
    if (!email) return { valido: true, messaggio: "" };
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return { valido: false, messaggio: "Formato email non valido" };
    }
    return { valido: true, messaggio: "" };
  },

  validaServizio(datiServizio) {
    const errori = [];
    if (!datiServizio.nome || datiServizio.nome.trim() === '') errori.push("Nome richiesto");
    if (!datiServizio.durata || isNaN(datiServizio.durata) || datiServizio.durata <= 0) errori.push("Durata non valida");
    if (!datiServizio.prezzo || isNaN(datiServizio.prezzo) || datiServizio.prezzo < 0) errori.push("Prezzo non valido");
    
    return {
      valido: errori.length === 0,
      messaggi: errori
    };
  },

  validaPrenotazione(dati) {
    const errNome = this.validaNome(dati.clienteNome);
    if (!errNome.valido) return errNome;
    
    const errTel = this.validaTelefono(dati.clienteTelefono);
    if (!errTel.valido) return errTel;
    
    const errEmail = this.validaEmail(dati.clienteEmail);
    if (!errEmail.valido) return errEmail;
    
    if (!dati.servizioId) return { valido: false, messaggio: "Servizio non selezionato" };
    if (!dati.barbiereId) return { valido: false, messaggio: "Barbiere non selezionato" };
    if (!dati.data || !dati.ora) return { valido: false, messaggio: "Data e ora non selezionati" };
    
    return { valido: true, messaggio: "" };
  },

  mostraErrore(inputElement, messaggio) {
    this.rimuoviErrore(inputElement);
    if (!inputElement) return;
    
    inputElement.classList.add('error');
    const errDiv = document.createElement('div');
    errDiv.className = 'error-message';
    errDiv.style.color = 'red';
    errDiv.style.fontSize = '12px';
    errDiv.style.marginTop = '4px';
    errDiv.innerText = messaggio;
    
    inputElement.parentNode.appendChild(errDiv);
  },

  rimuoviErrore(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove('error');
    const errorMsg = inputElement.parentNode.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.remove();
    }
  }
};
