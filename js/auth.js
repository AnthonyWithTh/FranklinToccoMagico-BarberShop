window.FranklinApp = window.FranklinApp || {};

FranklinApp.Auth = {
  // Ottiene l'utente corrente tramite la sessione Supabase
  async getUtenteLoggato() {
    const sb = window.FranklinApp.Storage.supabase;
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    return session ? session.user : null;
  },

  async isAutenticato() {
    const utente = await this.getUtenteLoggato();
    return utente !== null;
  },

  async hasPermission(page) {
    // Al momento, se sei autenticato tramite Supabase Auth,
    // consideriamo che sei Admin e hai tutti i permessi.
    return await this.isAutenticato();
  },

  async verificaAccesso() {
    const isAuth = await this.isAutenticato();
    if (!isAuth) {
      document.documentElement.style.display = 'none';
      window.location.href = 'login.html';
      return;
    }
  },

  async login(usernameOrEmail, password) {
    const sb = window.FranklinApp.Storage.supabase;
    let email = usernameOrEmail;

    // Se prova ad accedere come 'admin', bloccalo
    if (usernameOrEmail.toLowerCase() === 'admin') {
        return { success: false, message: "Per l'amministratore, inserire l'indirizzo email anziché l'username." };
    }

    // Se non c'è una @, presumiamo sia un username e lo convertiamo in email tramite l'RPC
    if (!usernameOrEmail.includes('@')) {
        const { data: resolvedEmail, error: rpcError } = await sb.rpc('get_email_by_username', { p_username: usernameOrEmail });
        
        if (rpcError || !resolvedEmail) {
            console.error("RPC Error:", rpcError);
            return { success: false, message: rpcError ? rpcError.message : "Username non trovato o errato" };
        }
        email = resolvedEmail;
    }

    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      return { success: false, message: "Password errata" };
    }
    
    return { success: true };
  },

  async logout() {
    const sb = window.FranklinApp.Storage.supabase;
    await sb.auth.signOut();
    window.location.href = 'login.html';
  },

  async cambiaPassword(vecchia, nuova) {
    // Supabase Auth permette di aggiornare la password dell'utente loggato
    const sb = window.FranklinApp.Storage.supabase;
    const { data, error } = await sb.auth.updateUser({
      password: nuova
    });
    
    if (error) {
      return { successo: false, messaggio: error.message };
    }
    return { successo: true, messaggio: "Password aggiornata con successo" };
  }
};
