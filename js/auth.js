window.FranklinApp = window.FranklinApp || {};

FranklinApp.Auth = {
  get client() {
    return window.FranklinApp.Storage.supabase;
  },

  async getUtenteLoggato() {
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) return null;
    return data.session.user;
  },

  async isAutenticato() {
    const utente = await this.getUtenteLoggato();
    return utente !== null;
  },

  async hasPermission(page) {
    const utente = await this.getUtenteLoggato();
    if (!utente) return false;
    // Per il nostro prototipo, qualsiasi utente autenticato su Supabase Auth (es. l'admin) ha tutti i permessi.
    // In futuro potremmo leggere la tabella "ruoli", ma l'RLS di Supabase protegge già il database alla fonte.
    return true; 
  },

  async verificaAccesso() {
    const isAuth = await this.isAutenticato();
    if (!isAuth) {
      document.documentElement.style.display = 'none';
      window.location.href = 'login.html';
    }
  },

  async login(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true };
  },

  async logout() {
    await this.client.auth.signOut();
    window.location.href = 'login.html';
  },

  async cambiaPassword(vecchia, nuova) {
    if (nuova.length < 6) {
      return { successo: false, messaggio: "La nuova password deve essere di almeno 6 caratteri" };
    }
    
    const { data, error } = await this.client.auth.updateUser({
      password: nuova
    });
    
    if (error) {
      return { successo: false, messaggio: error.message };
    }
    return { successo: true, messaggio: "Password aggiornata con successo" };
  }
};
