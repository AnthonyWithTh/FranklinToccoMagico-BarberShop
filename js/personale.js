document.addEventListener('DOMContentLoaded', () => {
    caricaDatiPersonali();
});

async function caricaDatiPersonali() {
    if (window.FranklinApp && window.FranklinApp.Auth) {
        const utente = await window.FranklinApp.Auth.getUtenteLoggato();
        if (utente) {
            document.getElementById('pers-nome').value = utente.user_metadata?.nome || '';
            document.getElementById('pers-cognome').value = utente.user_metadata?.cognome || '';
            document.getElementById('pers-username').value = utente.email || '';
            document.getElementById('pers-username').setAttribute('readonly', true); // Email is readonly per ora
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
    const nuovaPassword = document.getElementById('pers-nuova-password').value;
    const vecchiaPassword = document.getElementById('pers-vecchia-password').value;
    
    if (!nome || !cognome) {
        window.FranklinApp.Admin.mostraToast("Nome e Cognome sono obbligatori", "errore");
        return;
    }
    
    if (window.FranklinApp && window.FranklinApp.Auth) {
        const client = window.FranklinApp.Auth.client;
        
        // 1. Aggiorna nome e cognome
        const { error: updateError } = await client.auth.updateUser({
            data: { nome: nome, cognome: cognome }
        });
        
        if (updateError) {
            window.FranklinApp.Admin.mostraToast("Errore aggiornamento profilo: " + updateError.message, "errore");
            return;
        }

        // 2. Se è stata fornita una nuova password, cambiala
        if (nuovaPassword) {
            if (!vecchiaPassword) {
                window.FranklinApp.Admin.mostraToast("Inserisci la vecchia password per cambiarla", "errore");
                return;
            }
            
            // Re-autentica per sicurezza prima di cambiare password (richiede email)
            const utente = await window.FranklinApp.Auth.getUtenteLoggato();
            const { error: signInError } = await client.auth.signInWithPassword({
                email: utente.email,
                password: vecchiaPassword
            });
            
            if (signInError) {
                window.FranklinApp.Admin.mostraToast("Vecchia password non valida", "errore");
                return;
            }
            
            // Cambia password
            const res = await window.FranklinApp.Auth.cambiaPassword(vecchiaPassword, nuovaPassword);
            if (!res.successo) {
                window.FranklinApp.Admin.mostraToast(res.messaggio, "errore");
                return;
            }
        }
        
        window.FranklinApp.Admin.mostraToast("Dati personali aggiornati con successo!", "successo");
        
        document.getElementById('pers-vecchia-password').value = '';
        document.getElementById('pers-nuova-password').value = '';
        
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}
