document.addEventListener('DOMContentLoaded', () => {
    caricaDatiPersonali();
});

function caricaDatiPersonali() {
    if (window.FranklinApp && window.FranklinApp.Auth) {
        const utente = window.FranklinApp.Auth.getUtenteLoggato();
        if (utente) {
            document.getElementById('pers-nome').value = utente.nome || '';
            document.getElementById('pers-cognome').value = utente.cognome || '';
            document.getElementById('pers-username').value = utente.username || '';
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

function salvaDatiPersonali() {
    const nome = document.getElementById('pers-nome').value.trim();
    const cognome = document.getElementById('pers-cognome').value.trim();
    const nuovoUsername = document.getElementById('pers-username').value.trim();
    const nuovaPassword = document.getElementById('pers-nuova-password').value;
    
    const vecchioUsername = document.getElementById('pers-vecchio-username').value.trim();
    const vecchiaPassword = document.getElementById('pers-vecchia-password').value;
    
    if (!vecchioUsername || !vecchiaPassword) {
        window.FranklinApp.Admin.mostraToast("Devi inserire le tue vecchie credenziali per confermare", "errore");
        return;
    }
    
    if (!nome || !cognome || !nuovoUsername) {
        window.FranklinApp.Admin.mostraToast("Nome, Cognome e Nuovo Username sono obbligatori", "errore");
        return;
    }
    
    if (window.FranklinApp && window.FranklinApp.Auth && window.FranklinApp.Storage) {
        const authData = window.FranklinApp.Storage.ottieniAuth();
        const utenteLoggato = window.FranklinApp.Auth.getUtenteLoggato();
        
        if (!utenteLoggato) return;
        
        // Verifica vecchie credenziali
        const utenteDaVerificare = authData.utenti.find(u => u.username === vecchioUsername && u.password === vecchiaPassword);
        
        if (!utenteDaVerificare || utenteDaVerificare.id !== utenteLoggato.id) {
            window.FranklinApp.Admin.mostraToast("Vecchio Username o Vecchia Password non validi", "errore");
            return;
        }
        
        // Controlla se il nuovo username è già in uso da un ALTRO utente
        const usernameInUso = authData.utenti.some(u => u.username === nuovoUsername && u.id !== utenteLoggato.id);
        if (usernameInUso) {
            window.FranklinApp.Admin.mostraToast("Il nuovo Username è già in uso da un altro utente", "errore");
            return;
        }
        
        // Applica le modifiche
        const indiceUtente = authData.utenti.findIndex(u => u.id === utenteLoggato.id);
        if (indiceUtente !== -1) {
            authData.utenti[indiceUtente].nome = nome;
            authData.utenti[indiceUtente].cognome = cognome;
            authData.utenti[indiceUtente].username = nuovoUsername;
            
            if (nuovaPassword) {
                authData.utenti[indiceUtente].password = nuovaPassword;
            }
            
            // Salva nel localStorage centrale
            window.FranklinApp.Storage.salvaAuth(authData);
            
            window.FranklinApp.Admin.mostraToast("Dati personali aggiornati con successo!", "successo");
            
            // Pulisci i campi di conferma
            document.getElementById('pers-vecchio-username').value = '';
            document.getElementById('pers-vecchia-password').value = '';
            document.getElementById('pers-nuova-password').value = '';
            
            // Ricarica la sidebar per aggiornare il nome visualizzato
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            window.FranklinApp.Admin.mostraToast("Errore nel salvataggio", "errore");
        }
    }
}
