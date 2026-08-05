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

    // Protezione rotte client-side (RBAC)
    const path = window.location.pathname;
    const pageName = path.split('/').pop();
    
    // Mappa tra il nome della pagina e il permesso richiesto
    const pagePermissions = {
      'appointments.html': 'appointments',
      'services.html': 'services',
      'schedule.html': 'schedule',
      'barbers.html': 'barbers',
      'users.html': 'users',
      'settings.html': 'settings'
      // index.html e personale.html sono sempre accessibili se si ha fatto login
    };

    if (pagePermissions[pageName]) {
      const requiredPerm = pagePermissions[pageName];
      const sb = window.FranklinApp.Storage.supabase;
      const { data: { user } } = await sb.auth.getUser();
      
      if (user) {
        const { data: profilo } = await sb.from('utenti').select('ruoloid').eq('id', user.id).single();
        if (profilo && profilo.ruoloid) {
          const { data: ruolo } = await sb.from('ruoli').select('permessi').eq('id', profilo.ruoloid).single();
          
          // Se il ruolo esiste e non include il permesso, blocchiamo la pagina
          if (ruolo && ruolo.permessi && !ruolo.permessi.includes(requiredPerm)) {
            document.body.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: var(--color-black-100); color: var(--color-text-cream); text-align: center; padding: 2rem;">
                <h1 class="vintage-title" style="color: var(--color-danger); font-size: 3rem; margin-bottom: 1rem;">Accesso Negato</h1>
                <p style="font-family: var(--font-body); font-size: 1.2rem; margin-bottom: 2rem;">Non hai i permessi per accedere a questo contenuto.</p>
                <button onclick="window.history.back()" style="background-color: var(--color-brass-base); color: var(--color-black-100); border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 4px; font-family: var(--font-body);">Torna Indietro</button>
              </div>
            `;
          }
        }
      }
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
