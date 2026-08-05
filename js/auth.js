window.FranklinApp = window.FranklinApp || {};

FranklinApp.Auth = {
  async getUtenteLoggato() {
    const userId = sessionStorage.getItem('franklin_admin_user');
    if (!userId) return null;
    
    const authData = await window.FranklinApp.Storage.ottieniAuth();
    if (authData && authData.utenti) {
      return authData.utenti.find(u => u.id === userId) || null;
    }
    return null;
  },

  async isAutenticato() {
    const utente = await this.getUtenteLoggato();
    return utente !== null;
  },

  async hasPermission(page) {
    const utente = await this.getUtenteLoggato();
    if (!utente) return false;
    
    if (utente.ruoloId) {
        const authData = await window.FranklinApp.Storage.ottieniAuth();
        if (authData && authData.ruoli) {
            const ruolo = authData.ruoli.find(r => r.id === utente.ruoloId);
            if (ruolo && ruolo.permessi) {
                return ruolo.permessi.includes(page);
            }
        }
    }
    
    // Fallback retrocompatibilità se l'utente ha permessi diretti
    return utente.permessi && utente.permessi.includes(page);
  },

  async verificaAccesso() {
    const isAuth = await this.isAutenticato();
    if (!isAuth) {
      document.documentElement.style.display = 'none';
      window.location.href = 'login.html';
      return;
    }
    
    // Controlla permessi per la pagina corrente (dedotta dall'URL)
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    const pageIdMap = {
        'index.html': 'appointments', // Dashboard coincide con appointments per ora o 'dashboard'
        'appointments.html': 'appointments',
        'services.html': 'services',
        'schedule.html': 'schedule',
        'barbers.html': 'barbers',
        'settings.html': 'settings',
        'users.html': 'users',
        'personale.html': 'personale'
    };
    
    const requiredPermission = pageIdMap[pageName];
    if (requiredPermission) {
      const hasPerm = await this.hasPermission(requiredPermission);
      if (!hasPerm) {
        // Redirigi alla prima pagina disponibile o mostra errore
        const utente = await this.getUtenteLoggato();
        const authData = await window.FranklinApp.Storage.ottieniAuth();
        let userPerms = utente && utente.permessi ? utente.permessi : [];
        
        if (utente && utente.ruoloId && authData && authData.ruoli) {
            const ruolo = authData.ruoli.find(r => r.id === utente.ruoloId);
            if (ruolo && ruolo.permessi) {
                userPerms = ruolo.permessi;
            }
        }
        
        if (userPerms && userPerms.length > 0) {
            const firstPage = Object.keys(pageIdMap).find(key => pageIdMap[key] === userPerms[0]);
            if (firstPage && firstPage !== pageName) {
                document.documentElement.style.display = 'none';
                window.location.href = firstPage;
            } else {
                alert("Non hai i permessi per accedere a questa sezione.");
                document.documentElement.style.display = 'none';
                this.logout();
            }
        } else {
            document.documentElement.style.display = 'none';
            this.logout();
        }
    }
    }
  },

  async login(username, password) {
    const authData = await window.FranklinApp.Storage.ottieniAuth();
    
    if (authData && authData.utenti) {
      const utente = authData.utenti.find(u => u.username === username && u.password === password);
      if (utente) {
        sessionStorage.setItem('franklin_admin_user', utente.id);
        authData.ultimoAccesso = new Date().toISOString();
        await window.FranklinApp.Storage.salvaAuth(authData);
        return { success: true };
      }
    }
    
    // Fallback per migrazione non completata
    if (authData && authData.password === password && (!authData.utenti || authData.utenti.length === 0)) {
        // Se c'è solo la vecchia password e combacia, migriamo forzatamente
        await window.FranklinApp.Storage.inizializza(); // Forza la migrazione
        return await this.login('admin', password); // Riprova come admin
    }
    
    return { success: false, message: "Username o Password errati" };
  },

  logout() {
    sessionStorage.removeItem('franklin_admin_user');
    window.location.href = 'login.html';
  },

  async cambiaPassword(vecchia, nuova) {
    const utente = await this.getUtenteLoggato();
    if (!utente) return { successo: false, messaggio: "Non autenticato" };
    
    if (utente.password !== vecchia) {
      return { successo: false, messaggio: "Password vecchia non corretta" };
    }
    if (nuova.length < 6) {
      return { successo: false, messaggio: "La nuova password deve essere di almeno 6 caratteri" };
    }
    
    const authData = await window.FranklinApp.Storage.ottieniAuth();
    const index = authData.utenti.findIndex(u => u.id === utente.id);
    if (index !== -1) {
        authData.utenti[index].password = nuova;
        await window.FranklinApp.Storage.salvaAuth(authData);
        return { successo: true, messaggio: "Password aggiornata con successo" };
    }
    
    return { successo: false, messaggio: "Errore durante l'aggiornamento" };
  }
};
