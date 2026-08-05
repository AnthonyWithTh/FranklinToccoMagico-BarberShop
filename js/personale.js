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
    
    if (!nome || !cognome || !username) {
        window.FranklinApp.Admin?.mostraToast("Nome, Cognome e Username sono obbligatori", "errore");
        return;
    }
    
    const sb = window.FranklinApp.Storage.supabase;
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) return;
    
    // Recupera il ruolo attuale dell'utente (per non perderlo)
    const { data: profiloAttuale } = await sb.from('utenti').select('ruoloid').eq('id', user.id).single();
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

    document.getElementById('pers-nuova-password').value = '';
    window.FranklinApp.Admin?.mostraToast("Profilo aggiornato con successo! Le modifiche avranno effetto totale al prossimo accesso.", "successo");
    
    // Aggiorna nome nella sidebar
    const span = document.getElementById('sidebar-username');
    if (span) span.textContent = username;
}
