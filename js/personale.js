document.addEventListener('DOMContentLoaded', () => {
    caricaDatiPersonali();
});

async function caricaDatiPersonali() {
    if (window.FranklinApp && window.FranklinApp.Storage) {
        const sb = window.FranklinApp.Storage.supabase;
        const { data: { user } } = await sb.auth.getUser();
        
        if (user) {
            const { data: profilo } = await sb.from('utenti').select('*').eq('id', user.id).single();
            if (profilo) {
                document.getElementById('pers-nome').value = profilo.nome ? profilo.nome.split(' ')[0] : '';
                document.getElementById('pers-cognome').value = profilo.nome && profilo.nome.split(' ').length > 1 ? profilo.nome.split(' ').slice(1).join(' ') : '';
                document.getElementById('pers-username').value = profilo.username || '';
            }
        }
    }
}

function togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btnElement.style.opacity = '0.5';
    } else {
        input.type = 'password';
        btnElement.style.opacity = '1';
    }
}

async function salvaDatiPersonali() {
    const nome = document.getElementById('pers-nome').value.trim();
    const cognome = document.getElementById('pers-cognome').value.trim();
    const username = document.getElementById('pers-username').value.trim();
    const password = document.getElementById('pers-nuova-password').value;
    
    const vecchioUsername = document.getElementById('pers-vecchio-username').value.trim();
    const vecchiaPassword = document.getElementById('pers-vecchia-password').value;
    
    if (!vecchioUsername || !vecchiaPassword) {
        window.FranklinApp.Admin?.mostraToast("Devi inserire le tue vecchie credenziali per confermare", "errore");
        return;
    }
    
    if (!nome || !cognome || !username) {
        window.FranklinApp.Admin?.mostraToast("Nome, Cognome e Username sono obbligatori", "errore");
        return;
    }
    
    const sb = window.FranklinApp.Storage.supabase;
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) return;
    
    // Recupera il profilo attuale
    const { data: profiloAttuale } = await sb.from('utenti').select('username, ruoloid').eq('id', user.id).single();
    
    // Verifica username (l'admin base usa 'admin' ma la sua vera mail è admin@franklin.it)
    const currentDbUsername = (profiloAttuale && profiloAttuale.username) ? profiloAttuale.username : 'admin';
    if (vecchioUsername !== currentDbUsername && (vecchioUsername.toLowerCase() !== 'admin' || user.email !== 'admin@franklin.it')) {
        window.FranklinApp.Admin?.mostraToast("Il Vecchio Username non corrisponde al tuo account", "errore");
        return;
    }

    // Verifica password tentando un login sul momento
    const { error: signInError } = await sb.auth.signInWithPassword({
        email: user.email,
        password: vecchiaPassword
    });

    if (signInError) {
        window.FranklinApp.Admin?.mostraToast("La Vecchia Password non è corretta", "errore");
        return;
    }

    const ruoloId = profiloAttuale ? profiloAttuale.ruoloid : 'barbiere';

    const payload = {
        action: 'update_user',
        userId: user.id,
        nome,
        cognome,
        username,
        password,
        ruoloId
    };

    const { data, error } = await sb.functions.invoke('manage-users', {
        body: payload
    });

    if (error || (data && data.error)) {
        window.FranklinApp.Admin?.mostraToast("Errore durante il salvataggio: " + (error?.message || data?.error), "errore");
        return;
    }

    document.getElementById('pers-vecchio-username').value = '';
    document.getElementById('pers-vecchia-password').value = '';
    document.getElementById('pers-nuova-password').value = '';
    window.FranklinApp.Admin?.mostraToast("Profilo aggiornato con successo! Le modifiche avranno effetto totale al prossimo accesso.", "successo");
    
    // Aggiorna nome nella sidebar
    const span = document.getElementById('sidebar-username');
    if (span) span.textContent = username;
}
