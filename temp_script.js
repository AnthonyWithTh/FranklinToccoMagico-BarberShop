
        if (window.FranklinApp && window.FranklinApp.Auth) {
            if (!window.FranklinApp.Auth.isAutenticato()) {
                window.location.href = 'login.html';
            } else {
                window.FranklinApp.Auth.verificaAccesso();
            }
        }
    

        document.addEventListener('DOMContentLoaded', () => {
            if (window.FranklinApp && window.FranklinApp.Auth && !window.FranklinApp.Auth.isAutenticato()) {
                window.location.href = 'login.html';
                return;
            }
            caricaBarbieri();
        });

        let barbiereFileDaUploadare = null;
        let barbiereFileCaricatoNome = null;
        let eccezioniBarbieriSortAsc = false;

        function mostraTabImmagineBarbiere(tab) {
            const btnUpload = document.getElementById('btn-barbiere-tab-upload');
            const btnEsistente = document.getElementById('btn-barbiere-tab-esistente');
            const boxUpload = document.getElementById('box-barbiere-tab-upload');
            const boxEsistente = document.getElementById('box-barbiere-tab-esistente');

            if (tab === 'upload') {
                btnUpload.classList.add('active');
                btnEsistente.classList.remove('active');
                boxUpload.style.display = 'block';
                boxEsistente.style.display = 'none';
            } else {
                btnUpload.classList.remove('active');
                btnEsistente.classList.add('active');
                boxUpload.style.display = 'none';
                boxEsistente.style.display = 'block';
                mostraSelezioneImmagine();
            }
        }

        async function mostraSelezioneImmagine() {
            const select = document.getElementById('barbiere-immagine-esistente');
            if (!select) return;

            // Ottieni lista immagini dal bucket Supabase!
            let opzioni = [];
            const storageImmagini = await window.FranklinApp.Storage.listaImmagini('immagini_barbieri') || [];
            storageImmagini.forEach(imgUrl => {
                const nomeFile = imgUrl.split('/').pop().split('?')[0] || imgUrl;
                opzioni.push({ val: imgUrl, label: `☁️ ${nomeFile}` });
            });

            const valAttuale = document.getElementById('barbiere-foto').value;
            let optionsHtml = '<option value="">Seleziona immagine</option>';
            
            opzioni.forEach(opt => {
                const selected = (opt.val === valAttuale) ? 'selected' : '';
                optionsHtml += `<option value="${opt.val}" ${selected}>${opt.label}</option>`;
            });

            select.innerHTML = optionsHtml;
        }

        function selezionaImmagineEsistenteBarbiere(val) {
            if (!val) return;
            barbiereFileCaricatoDataUrl = null;
            barbiereFileCaricatoNome = null;
            document.getElementById('barbiere-file').value = '';
            document.getElementById('barbiere-foto').value = val;
            
            const anteprimaImg = document.getElementById('barbiere-anteprima-img');
            if (anteprimaImg) {
                anteprimaImg.src = window.FranklinApp.Storage.fixImagePath(val, true);
            }
            const display = document.getElementById('barbiere-immagine-nome-display');
            if (display) {
                const nomeFile = val.split('/').pop() || val;
                display.textContent = nomeFile;
            }
        }

        function gestisciCaricamentoFileBarbiere(input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                barbiereFileDaUploadare = file;
                barbiereFileCaricatoNome = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
                
                // Anteprima immediata
                const previewUrl = URL.createObjectURL(file);
                const img = document.getElementById('barbiere-anteprima-img');
                if (img) img.src = previewUrl;

                const display = document.getElementById('barbiere-immagine-nome-display');
                if (display) display.textContent = 'Da caricare: ' + barbiereFileCaricatoNome;
                
                // Pulisci il campo foto per dire che usiamo il nuovo file
                document.getElementById('barbiere-foto').value = '';
            }
        }

        async function caricaBarbieri() {
            if(window.FranklinApp && window.FranklinApp.Storage) {
                if (!window.FranklinApp.Storage.supabase) {
                    await window.FranklinApp.Storage.inizializza();
                }
                const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
                const tbody = document.getElementById('barbieri-tbody');
                
                if (barbieri.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nessun barbiere trovato</td></tr>';
                    return;
                }
                
                caricaEccezioniGlobali(barbieri);
                tbody.innerHTML = barbieri.map(b => {
                    const opacity = b.attivo === false ? 'opacity: 0.4;' : '';
                    const rawFoto = (b.foto && b.foto.trim()) ? b.foto : (b.ritratto && b.ritratto.trim()) ? b.ritratto : 'assets/images/barbiere-marco.jpg';
                    const fotoUrl = window.FranklinApp.Storage.fixImagePath(rawFoto, true);
                    const fallbackFoto = '../assets/images/barbiere-marco.jpg';
                    
                    let n = b.nome || '';
                    let c = b.cognome || '';
                    if (!c && n.includes(' ')) {
                        const parti = n.split(' ');
                        n = parti[0];
                        c = parti.slice(1).join(' ');
                    }

                    // Calcolo età e formattazione dalla data di nascita
                    let etaDisplay = '-';
                    let dataNascitaDisplay = '-';
                    if (b.data_nascita) {
                        const dob = new Date(b.data_nascita);
                        if (!isNaN(dob.getTime())) {
                            const diff = Date.now() - dob.getTime();
                            const ageDt = new Date(diff); 
                            etaDisplay = Math.abs(ageDt.getUTCFullYear() - 1970) + ' anni';
                            
                            const options = { year: 'numeric', month: 'long', day: 'numeric' };
                            dataNascitaDisplay = dob.toLocaleDateString('it-IT', options);
                        }
                    }

                    const selectStato = `
                        <select class="vintage-select" style="padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; height: auto;" onchange="cambiaStatoBarbiere('${b.id}', this.value)">
                            <option value="true" ${b.attivo !== false ? 'selected' : ''}>Disponibile</option>
                            <option value="false" ${b.attivo === false ? 'selected' : ''}>Non Disponibile</option>
                        </select>
                    `;
                    return `
                    <tr style="${opacity}">
                        <td><strong>${n}</strong></td>
                        <td><strong>${c || '-'}</strong></td>
                        <td>${dataNascitaDisplay}</td>
                        <td>${etaDisplay}</td>
                        <td>${b.ruolo || 'Barbiere'}</td>
                        <td>
                            <div style="display: flex; align-items: center; justify-content: center;">
                                <img src="${fotoUrl}" alt="${b.nome}" 
                                     onerror="this.onerror=null; this.src='${fallbackFoto}';"
                                     style="width: 52px; height: 52px; object-fit: cover; border-radius: 50%; border: 1.5px solid var(--color-brass-dark); box-shadow: 0 3px 8px rgba(0,0,0,0.5); transition: transform 0.2s ease, border-color 0.2s ease; cursor: pointer;"
                                     onmouseover="this.style.transform='scale(1.15)'; this.style.borderColor='var(--color-brass-light)';" 
                                     onmouseout="this.style.transform='scale(1)'; this.style.borderColor='var(--color-brass-dark)';"
                                     onclick="window.open('${fotoUrl}', '_blank')"
                                     title="Clicca per ingrandire">
                            </div>
                        </td>
                        <td>
                            <div style="font-size: 0.85rem; color: var(--color-text-cream); line-height: 1.35; max-height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${b.descrizione || '<span style="color:var(--color-text-muted); font-style:italic;">Nessuna descrizione</span>'}</div>
                        </td>
                        <td>${selectStato}</td>
                        <td style="white-space: nowrap;">
                            <button class="azioni-btn" title="Modifica" onclick="apriModaleBarbiere('${b.id}')">✏️</button>
                            <button class="azioni-btn" title="Duplica" onclick="duplicaBarbiere('${b.id}')">📋</button>
                            <button class="azioni-btn" title="Elimina" style="color: var(--color-danger);" onclick="eliminaBarbiere('${b.id}')">🗑️</button>
                        </td>
                    </tr>
                `}).join('');
            }
        }

        async function duplicaBarbiere(id) {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
            const barbiereOriginale = barbieri.find(b => b.id === id);
            
            if (!barbiereOriginale) return;
            
            const payload = {
                nome: (barbiereOriginale.nome || '') + ' (Copia)',
                cognome: barbiereOriginale.cognome,
                data_nascita: barbiereOriginale.data_nascita,
                ruolo: barbiereOriginale.ruolo,
                foto: barbiereOriginale.foto,
                descrizione: barbiereOriginale.descrizione
            };
            
            const newId = await window.FranklinApp.Storage.aggiungiBarbiere(payload);
            
            if (newId) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Barbiere duplicato con successo", "successo");
                }
                caricaBarbieri();
            } else {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Errore durante la duplicazione", "errore");
                }
            }
        }

        async function eliminaBarbiere(id) {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
            const barbiere = barbieri.find(b => b.id === id);
            const nome = barbiere ? (barbiere.nome + (barbiere.cognome ? ' ' + barbiere.cognome : '')) : 'Sconosciuto';
            
            if (!confirm('Sei sicuro di voler eliminare "' + nome + '"?\n\nVerranno eliminati anche tutti i suoi permessi (Supabase ON DELETE CASCADE).\nQuesta azione è irreversibile.')) return;
            
            const success = await window.FranklinApp.Storage.eliminaBarbiere(id);
            
            if (success) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Barbiere eliminato", "successo");
                }
                caricaBarbieri();
            } else {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Errore durante l'eliminazione", "errore");
                }
            }
        }

        function aggiornaContatoreDescrizione(val = '') {
            const counter = document.getElementById('barbiere-descrizione-counter');
            if (counter) {
                const len = (val || '').length;
                counter.textContent = `${len} / 200`;
                if (len >= 200) {
                    counter.style.color = 'var(--color-danger)';
                } else {
                    counter.style.color = 'var(--color-text-muted)';
                }
            }
        }

        async function apriModaleBarbiere(id = null) {
            const modale = document.getElementById('modale-barbiere');
            const form = document.getElementById('form-barbiere');
            const titolo = document.getElementById('modale-barbiere-titolo');
            const anteprimaImg = document.getElementById('barbiere-anteprima-img');
            const fileInput = document.getElementById('barbiere-file');
            const display = document.getElementById('barbiere-immagine-nome-display');
            
            form.reset();
            barbiereFileDaUploadare = null;
            barbiereFileCaricatoNome = null;
            if (fileInput) fileInput.value = '';
            mostraTabImmagineBarbiere('upload');
            
            if (id) {
                titolo.textContent = "Modifica Barbiere";
                const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
                const b = barbieri.find(x => x.id === id);
                if (b) {
                    let n = b.nome || '';
                    let c = b.cognome || '';
                    if (!c && n.includes(' ')) {
                        const parti = n.split(' ');
                        n = parti[0];
                        c = parti.slice(1).join(' ');
                    }
                    document.getElementById('barbiere-id').value = b.id;
                    document.getElementById('barbiere-nome').value = n;
                    document.getElementById('barbiere-cognome').value = c;
                    document.getElementById('barbiere-data-nascita').value = b.data_nascita || '';
                    document.getElementById('barbiere-ruolo').value = b.ruolo || '';
                    const fotoVal = b.foto || b.ritratto || '';
                    document.getElementById('barbiere-foto').value = fotoVal;
                    document.getElementById('barbiere-descrizione').value = b.descrizione || '';
                    
                    if (anteprimaImg) {
                        anteprimaImg.src = window.FranklinApp.Storage.fixImagePath(fotoVal, true);
                    }
                    if (display) {
                        const nomeFile = fotoVal.length > 100 ? "Immagine caricata" : (fotoVal.split('/').pop() || 'Nessuna immagine');
                        display.textContent = nomeFile;
                    }
                    aggiornaContatoreDescrizione(b.descrizione || '');
                }
            } else {
                titolo.textContent = "Aggiungi Barbiere";
                document.getElementById('barbiere-id').value = '';
                document.getElementById('barbiere-nome').value = '';
                document.getElementById('barbiere-cognome').value = '';
                document.getElementById('barbiere-data-nascita').value = '';
                document.getElementById('barbiere-ruolo').value = '';
                document.getElementById('barbiere-foto').value = '';
                document.getElementById('barbiere-descrizione').value = '';
                if (anteprimaImg) {
                    anteprimaImg.src = '../assets/images/barbiere-marco.jpg';
                }
                if (display) display.textContent = 'Seleziona un file o un\'immagine esistente';
                aggiornaContatoreDescrizione('');
            }
            
            modale.style.display = 'flex';
        }

        function chiudiModaleBarbiere() {
            document.getElementById('modale-barbiere').style.display = 'none';
        }

        async function salvaBarbiere() {
            const id = document.getElementById('barbiere-id').value;
            const nome = (document.getElementById('barbiere-nome').value || '').trim();
            const cognome = (document.getElementById('barbiere-cognome').value || '').trim();
            const dataNascita = document.getElementById('barbiere-data-nascita').value;
            const ruolo = (document.getElementById('barbiere-ruolo').value || '').trim();
            const foto = (document.getElementById('barbiere-foto').value || '').trim();
            const descrizione = (document.getElementById('barbiere-descrizione').value || '').trim();
            
            if (!nome || !cognome || !dataNascita || !ruolo || !descrizione) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Tutti i campi (Nome, Cognome, Data Nascita, Ruolo, Descrizione) sono obbligatori!", "errore");
                } else {
                    alert("Tutti i campi sono obbligatori!");
                }
                return;
            }

            if (!foto && !barbiereFileDaUploadare) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Seleziona o carica un ritratto per il barbiere!", "errore");
                } else {
                    alert("Seleziona o carica un ritratto per il barbiere!");
                }
                return;
            }

            if (descrizione.length > 200) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("La descrizione non può superare i 200 caratteri!", "errore");
                } else {
                    alert("La descrizione non può superare i 200 caratteri!");
                }
                return;
            }

            let finalFoto = foto;

            if (barbiereFileDaUploadare) {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Caricamento immagine in corso...", "info");
                }
                const btnSave = event ? event.target.querySelector('button[type="submit"]') : null;
                if (btnSave) btnSave.disabled = true;

                const urlStorage = await window.FranklinApp.Storage.uploadImmagine(barbiereFileDaUploadare, 'immagini_barbieri');
                
                if (btnSave) btnSave.disabled = false;
                
                if (!urlStorage) return; // Errore già mostrato da uploadImmagine
                finalFoto = urlStorage;
            }

            const payload = {
                nome,
                cognome,
                data_nascita: dataNascita,
                ruolo,
                foto: finalFoto,
                descrizione
            };
            
            let success = false;
            if (id) {
                success = await window.FranklinApp.Storage.aggiornaBarbiere(id, payload);
            } else {
                const newId = await window.FranklinApp.Storage.aggiungiBarbiere(payload);
                success = !!newId;
            }
            
            if (success) {
                chiudiModaleBarbiere();
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Barbiere salvato con successo!", "successo");
                }
                caricaBarbieri();
            } else {
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast("Errore durante il salvataggio in Supabase.", "errore");
                } else {
                    alert("Errore durante il salvataggio.");
                }
            }
        }

        async function cambiaStatoBarbiere(id, value) {
            const isActive = value === "true";
            
            // Invece di toggle (che inverte), usiamo l'aggiorna per forzare lo stato desiderato
            const success = await window.FranklinApp.Storage.aggiornaBarbiere(id, { attivo: isActive });
            
            if (success) {
                if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Stato barbiere aggiornato", "successo");
                caricaBarbieri();
            } else {
                if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Errore durante l'aggiornamento dello stato", "errore");
            }
        }


        function caricaEccezioniGlobali(barbieri) {
            tutteEccezioniBarbieri = [];
            
            const filtroSelect = document.getElementById('filtro-barbiere-eccezioni');
            const oldValue = filtroSelect.value;
            filtroSelect.innerHTML = '<option value="tutti">Tutti i barbieri</option>';
            
            barbieri.forEach(b => {
                if (b.attivo !== false) {
                    filtroSelect.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
                }
                const ecc = b.giorniEccezionali || [];
                ecc.forEach(e => {
                    tutteEccezioniBarbieri.push({
                        ...e,
                        barbiereId: b.id,
                        barbiereNome: b.nome
                    });
                });
            });
            
            const annoSelectEcc = document.getElementById('filtro-anno-eccezioni');
            const annoSelectRiep = document.getElementById('filtro-anno-riepilogo');
            
            if (annoSelectEcc.options.length === 0) {
                const curYear = new Date().getFullYear();
                let yearOptions = '<option value="tutti">Tutti gli anni</option>';
                for (let y = curYear - 1; y <= curYear + 2; y++) {
                    const isSelected = y === curYear ? 'selected' : '';
                    yearOptions += `<option value="${y}" ${isSelected}>${y}</option>`;
                }
                annoSelectEcc.innerHTML = yearOptions;
                annoSelectRiep.innerHTML = yearOptions.replace('<option value="tutti">Tutti gli anni</option>', '');
            }
            
            if (oldValue && filtroSelect.querySelector(`option[value="${oldValue}"]`)) {
                filtroSelect.value = oldValue;
            }
            
            filtraEccezioniBarbieri();
            filtraRiepilogoBarbieri();
        }

        function filtraEccezioniBarbieri() {
            const filtroId = document.getElementById('filtro-barbiere-eccezioni').value;
            const filtroAnno = document.getElementById('filtro-anno-eccezioni').value;
            
            let filtrate = tutteEccezioniBarbieri;
            
            if (filtroId !== 'tutti') {
                filtrate = filtrate.filter(e => e.barbiereId === filtroId);
            }
            if (filtroAnno !== 'tutti') {
                filtrate = filtrate.filter(e => e.data.startsWith(filtroAnno));
            }
            
            renderGiorniEccezionali(filtrate);
        }

        async function filtraRiepilogoBarbieri() {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
            renderRiepilogoBarbieri(tutteEccezioniBarbieri, barbieri);
        }

        function toggleSortEccezioniBarbieri() {
            eccezioniBarbieriSortAsc = !eccezioniBarbieriSortAsc;
            const icon = document.getElementById('sort-icon-barbieri');
            if (icon) icon.textContent = eccezioniBarbieriSortAsc ? '▲' : '▼';
            filtraEccezioniBarbieri();
        }

        function renderRiepilogoBarbieri(eccezionali, barbieri) {
            const tbody = document.getElementById('riepilogo-tbody');
            tbody.innerHTML = '';
            
            const selectedYear = document.getElementById('filtro-anno-riepilogo').value || new Date().getFullYear().toString();
            
            barbieri.forEach(b => {
                if (b.attivo === false) return;
                
                const eccBarbiere = eccezionali.filter(e => e.barbiereId === b.id && e.data.startsWith(selectedYear));
                
                let ferie = 0, malattia = 0, permessi = 0, imprevisti = 0;
                
                eccBarbiere.forEach(e => {
                    const conteggio = e.interaGiornata ? 1 : 0.5;
                    if (e.motivo === 'Ferie') ferie += conteggio;
                    else if (e.motivo === 'Malattia') malattia += conteggio;
                    else if (e.motivo === 'Permesso') permessi += conteggio;
                    else if (e.motivo === 'Imprevisto') imprevisti += conteggio;
                });
                
                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight: bold; color: var(--color-brass-light);">${b.nome}</td>
                        <td>${ferie} giorni</td>
                        <td>${malattia} giorni</td>
                        <td>${permessi} giorni</td>
                        <td>${imprevisti} giorni</td>
                    </tr>
                `;
            });
            
            if (tbody.innerHTML === '') {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">Nessun dato disponibile</td></tr>';
            }
        }

        function renderGiorniEccezionali(eccezionali) {
            const tbody = document.getElementById('eccezionali-tbody');
            tbody.innerHTML = '';
            
            if (eccezionali.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">Nessuna richiesta inserita</td></tr>';
                return;
            }
            
            eccezionali.sort((a, b) => {
                const res = a.data.localeCompare(b.data);
                return eccezioniBarbieriSortAsc ? res : -res;
            });
            
            eccezionali.forEach((exc, index) => {
                const intera = exc.interaGiornata ? 'Sì' : 'No';
                const dalle = exc.interaGiornata ? '-' : exc.dalle;
                const alle = exc.interaGiornata ? '-' : exc.alle;
                
                const dataFormattata = window.FranklinApp.DateHelpers ? window.FranklinApp.DateHelpers.formattaDataSenzaGiorno(exc.data) : exc.data;
                const filtroId = document.getElementById('filtro-barbiere-eccezioni').value;
                const motivoConBarbiere = filtroId === 'tutti' ? `${exc.motivo} <small style="color:var(--color-text-muted);">(${exc.barbiereNome})</small>` : exc.motivo;
                
                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight: bold; color: var(--color-brass-light);">${dataFormattata}</td>
                        <td>${motivoConBarbiere}</td>
                        <td>${intera}</td>
                        <td>${dalle}</td>
                        <td>${alle}</td>
                        <td>
                            <button type="button" class="azioni-btn" onclick="modificaGiornoEccezionaleBarbiere('${exc.barbiereId}', '${exc.data}')" title="Modifica">✏️</button>
                            <button type="button" class="azioni-btn btn-danger" onclick="eliminaGiornoEccezionaleBarbiere('${exc.barbiereId}', '${exc.data}')" title="Elimina">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }

        function generaSelectBarbiere(barbieri, selectedId = "") {
            let options = '<option value="">-- Seleziona Barbiere --</option>';
            barbieri.forEach(b => {
                if (b.attivo || b.id === selectedId) {
                    const isSelected = b.id === selectedId ? 'selected' : '';
                    options += `<option value="${b.id}" ${isSelected}>${b.nome}</option>`;
                }
            });
            return `<select id="eccezione-barbiere-id" class="vintage-select" style="width: 100%;" required onchange="ricalcolaModaleEccezioneBarbiere()">${options}</select>`;
        }

        async function apriModaleEccezioneBarbiere() {
            document.getElementById('form-eccezione-barbiere').reset();
            document.getElementById('eccezione-barbiere-old-data').value = "";
            document.getElementById('eccezione-barbiere-old-id').value = "";
            document.getElementById('modale-eccezione-barbiere-titolo').textContent = "Aggiungi Richiesta";
            
            const dataInput = document.getElementById('eccezione-barbiere-data');
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            dataInput.min = today.toISOString().split('T')[0];
            
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
            document.getElementById('eccezione-barbiere-select-container').innerHTML = generaSelectBarbiere(barbieri);
            
            await ricalcolaModaleEccezioneBarbiere();
            document.getElementById('modale-eccezione-barbiere').style.display = 'flex';
        }
        
        function chiudiModaleEccezioneBarbiere() {
            document.getElementById('modale-eccezione-barbiere').style.display = 'none';
        }
        
        async function ricalcolaModaleEccezioneBarbiere() {
            const barbiereSelect = document.getElementById('eccezione-barbiere-id');
            const dataInput = document.getElementById('eccezione-barbiere-data');
            const motivoSelect = document.getElementById('eccezione-barbiere-motivo');
            const interaCheck = document.getElementById('eccezione-barbiere-intera');
            const dalleSelect = document.getElementById('eccezione-barbiere-dalle');
            const alleSelect = document.getElementById('eccezione-barbiere-alle');
            
            if (!barbiereSelect || !barbiereSelect.value) {
                dataInput.disabled = true;
                motivoSelect.disabled = true;
                interaCheck.disabled = true;
                dalleSelect.disabled = true;
                alleSelect.disabled = true;
                return;
            }
            
            dataInput.disabled = false;
            
            if (!dataInput.value) {
                motivoSelect.disabled = true;
                interaCheck.disabled = true;
                dalleSelect.disabled = true;
                alleSelect.disabled = true;
                return;
            }
            
            motivoSelect.disabled = false;
            interaCheck.disabled = false;
            
            const dateObj = new Date(dataInput.value);
            const numGiorno = dateObj.getDay(); 
            const mapGiorni = [6, 0, 1, 2, 3, 4, 5]; 
            const giorniNomi = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
            const nomeGiorno = giorniNomi[mapGiorni[numGiorno]];
            
            let slotPermessi = [];
            
            if (window.FranklinApp && window.FranklinApp.Storage) {
                const imp = await window.FranklinApp.Storage.ottieniImpostazioni();
                const orarioNormale = imp.orariLavoro ? imp.orariLavoro[nomeGiorno] : null;
                
                if (!orarioNormale || orarioNormale.chiuso) {
                    interaCheck.checked = true;
                    interaCheck.disabled = true;
                } else {
                    const genera = (inizio, fine) => {
                        if (!inizio || !fine) return;
                        const [h1, m1] = inizio.split(':').map(Number);
                        const [h2, m2] = fine.split(':').map(Number);
                        const startMin = h1 * 60 + m1;
                        const endMin = h2 * 60 + m2;
                        
                        for (let t = startMin; t <= endMin; t += 15) {
                            const hh = Math.floor(t / 60).toString().padStart(2, '0');
                            const mm = (t % 60).toString().padStart(2, '0');
                            slotPermessi.push(`${hh}:${mm}`);
                        }
                    };
                    if (orarioNormale.orarioMattina && orarioNormale.orarioMattina.includes('-')) {
                        const parts = orarioNormale.orarioMattina.split('-');
                        genera(parts[0], parts[1]);
                    }
                    if (orarioNormale.orarioPomeriggio && orarioNormale.orarioPomeriggio.includes('-')) {
                        const parts = orarioNormale.orarioPomeriggio.split('-');
                        genera(parts[0], parts[1]);
                    }
                    
                    slotPermessi.sort();
                }
            }
            
            if (interaCheck.checked) {
                dalleSelect.disabled = true;
                alleSelect.disabled = true;
                dalleSelect.innerHTML = '';
                alleSelect.innerHTML = '';
            } else {
                dalleSelect.disabled = false;
                alleSelect.disabled = false;
                
                const oldDalle = dalleSelect.value;
                const oldAlle = alleSelect.value;
                
                dalleSelect.innerHTML = '<option value="">-- Seleziona --</option>';
                alleSelect.innerHTML = '<option value="">-- Seleziona --</option>';
                
                slotPermessi.forEach(slot => {
                    dalleSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
                });
                
                if (oldDalle && slotPermessi.includes(oldDalle)) {
                    dalleSelect.value = oldDalle;
                }
                
                if (dalleSelect.value) {
                    const idx = slotPermessi.indexOf(dalleSelect.value);
                    if (idx !== -1) {
                        for (let i = idx + 1; i < slotPermessi.length; i++) {
                            alleSelect.innerHTML += `<option value="${slotPermessi[i]}">${slotPermessi[i]}</option>`;
                        }
                    }
                    if (oldAlle && alleSelect.querySelector(`option[value="${oldAlle}"]`)) {
                        alleSelect.value = oldAlle;
                    }
                } else {
                    alleSelect.disabled = true;
                }
            }
        }
        
        async function salvaGiornoEccezionaleBarbiere() {
            const barbiereId = document.getElementById('eccezione-barbiere-id').value;
            const dataStr = document.getElementById('eccezione-barbiere-data').value;
            const motivo = document.getElementById('eccezione-barbiere-motivo').value;
            const intera = document.getElementById('eccezione-barbiere-intera').checked;
            const dalle = document.getElementById('eccezione-barbiere-dalle').value;
            const alle = document.getElementById('eccezione-barbiere-alle').value;
            
            const oldId = document.getElementById('eccezione-barbiere-old-id').value; // In realtà questo ora deve contenere l'ID del permesso, non l'id del barbiere
            const permessoId = document.getElementById('eccezione-barbiere-old-data').value; // Ricicliamo i campi vecchi per tenere l'id univoco del permesso Supabase
            
            if (!intera && (!dalle || !alle)) {
                if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Inserisci un orario valido", "errore");
                return;
            }
            
            const permesso = {
                id: permessoId ? permessoId : null,
                data: dataStr,
                motivo: motivo,
                interaGiornata: intera,
                dalle: intera ? '' : dalle,
                alle: intera ? '' : alle
            };
            
            const success = await window.FranklinApp.Storage.salvaPermessoBarbiere(barbiereId, permesso);
            
            if (success) {
                chiudiModaleEccezioneBarbiere();
                if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Richiesta salvata", "successo");
                await caricaBarbieri();
            } else {
                if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Errore durante il salvataggio", "errore");
            }
        }
        
        async function modificaGiornoEccezionaleBarbiere(barbiereId, dataStr) {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
            const b = barbieri.find(x => x.id === barbiereId);
            if (!b) return;
            
            const exc = (b.giorniEccezionali || []).find(e => e.data === dataStr);
            if (exc) {
                document.getElementById('eccezione-barbiere-old-data').value = exc.id; 
                document.getElementById('eccezione-barbiere-old-id').value = barbiereId;
                document.getElementById('modale-eccezione-barbiere-titolo').textContent = "Modifica Richiesta";
                
                document.getElementById('eccezione-barbiere-select-container').innerHTML = generaSelectBarbiere(barbieri, barbiereId);
                
                const dataInput = document.getElementById('eccezione-barbiere-data');
                dataInput.value = exc.data;
                dataInput.disabled = false;
                const today = new Date();
                today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
                dataInput.min = today.toISOString().split('T')[0];
                
                document.getElementById('eccezione-barbiere-motivo').value = exc.motivo;
                document.getElementById('eccezione-barbiere-motivo').disabled = false;
                
                document.getElementById('eccezione-barbiere-intera').checked = exc.interaGiornata;
                document.getElementById('eccezione-barbiere-intera').disabled = false;
                
                await ricalcolaModaleEccezioneBarbiere();
                
                if (!exc.interaGiornata) {
                    document.getElementById('eccezione-barbiere-dalle').value = exc.dalle;
                    document.getElementById('eccezione-barbiere-alle').value = exc.alle;
                }
                
                document.getElementById('modale-eccezione-barbiere').style.display = 'flex';
            }
        }
        
        async function eliminaGiornoEccezionaleBarbiere(barbiereId, dataStr) {
            if (confirm(`Sei sicuro di voler eliminare la richiesta del ${dataStr}?`)) {
                const barbieri = await window.FranklinApp.Storage.ottieniBarbieri() || [];
                const b = barbieri.find(x => x.id === barbiereId);
                if (b) {
                    const exc = (b.giorniEccezionali || []).find(e => e.data === dataStr);
                    if (exc && exc.id) {
                        const success = await window.FranklinApp.Storage.eliminaPermessoBarbiere(exc.id);
                        if (success) {
                            if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Richiesta eliminata", "successo");
                            await caricaBarbieri();
                        } else {
                            if(window.FranklinApp.Admin) window.FranklinApp.Admin.mostraToast("Errore durante l'eliminazione", "errore");
                        }
                    }
                }
            }
        }
    
