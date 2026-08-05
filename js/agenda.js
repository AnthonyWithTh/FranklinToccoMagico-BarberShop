/**
 * Agenda Logic (Table Layout, 7 days from reference date)
 */
window.Agenda = (function() {
    // State
    let currentDate = new Date(); // Represents the FIRST column of the calendar
    currentDate.setHours(0, 0, 0, 0);

    let startHour = 8;
    let endHour = 20;
    
    // Nuovi filtri
    let interval = 15; // Minuti per riga
    let selectedBarber = null;

    async function init() {
        // Load preferences from localStorage
        const storedStart = localStorage.getItem('agenda_startHour');
        const storedEnd = localStorage.getItem('agenda_endHour');
        const storedBarber = localStorage.getItem('agenda_barber');

        if (storedStart) startHour = parseInt(storedStart);
        if (storedEnd) endHour = parseInt(storedEnd);
        if (storedBarber) selectedBarber = storedBarber;

        await popolaFiltri();
        populateHours();
        await render();
    }
    
    async function popolaFiltri() {
        const barbiereSelect = document.getElementById('agenda-filter-barbiere');
        
        if (barbiereSelect && window.FranklinApp && window.FranklinApp.Storage) {
            const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();
            barbiereSelect.innerHTML = '';
            
            let firstBarberId = null;
            barbieri.forEach(b => {
                if(b.attivo !== false) {
                    if (!firstBarberId) firstBarberId = b.id;
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.textContent = b.nome;
                    barbiereSelect.appendChild(opt);
                }
            });
            
            if (!selectedBarber || selectedBarber === 'tutti') {
                selectedBarber = firstBarberId;
            }
            barbiereSelect.value = selectedBarber;
        }
    }
    
    async function cambiaFiltri() {
        const barbiereSelect = document.getElementById('agenda-filter-barbiere');
        
        if (barbiereSelect) selectedBarber = barbiereSelect.value;
        
        localStorage.setItem('agenda_barber', selectedBarber);
        
        await render();
    }

    function populateHours() {
        const startSelect = document.getElementById('agenda-start-hour');
        const endSelect = document.getElementById('agenda-end-hour');
        if (!startSelect || !endSelect) return;

        startSelect.innerHTML = '';
        endSelect.innerHTML = '';

        for (let i = 0; i <= 23; i++) {
            const hourStr = i.toString().padStart(2, '0') + ':00';
            
            const startOption = document.createElement('option');
            startOption.value = i;
            startOption.textContent = hourStr;
            startSelect.appendChild(startOption);

            const endOption = document.createElement('option');
            endOption.value = i;
            endOption.textContent = hourStr;
            endSelect.appendChild(endOption);
        }

        startSelect.value = startHour;
        endSelect.value = endHour;
    }

    async function cambiaRangeOrario() {
        const newStart = parseInt(document.getElementById('agenda-start-hour').value);
        const newEnd = parseInt(document.getElementById('agenda-end-hour').value);

        if (newStart > newEnd) {
            if (window.FranklinApp && window.FranklinApp.Pubblico) {
                window.FranklinApp.Pubblico.mostraToast("L'orario di inizio deve essere precedente a quello di fine.", "errore");
            } else {
                alert("L'orario di inizio deve essere precedente a quello di fine.");
            }
            populateHours(); // reset
            return;
        }

        startHour = newStart;
        endHour = newEnd;
        localStorage.setItem('agenda_startHour', startHour);
        localStorage.setItem('agenda_endHour', endHour);
        
        await render();
    }

    async function cambiaGiorno(offset) {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        if (newDate < oggi) {
            if (window.FranklinApp && window.FranklinApp.Admin) {
                window.FranklinApp.Admin.mostraToast("Non puoi visualizzare date passate.", "errore");
            }
            return;
        }
        
        currentDate = newDate;
        await render();
    }

    async function vaiAOggi() {
        currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        await render();
    }

    async function vaiAData(dateString) {
        if (!dateString) return;
        const newDate = new Date(dateString);
        newDate.setHours(0, 0, 0, 0);
        currentDate = newDate;
        await render();
    }

    function syncDatePicker() {
        const picker = document.getElementById('agenda-date-picker');
        if (picker) {
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            picker.value = `${year}-${month}-${day}`;
        }
    }

    function formatShortDate(date) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        const dayName = dayNames[date.getDay()];
        const dayStr = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const monthStr = monthNames[date.getMonth()];
        return { name: dayName, date: `${dayStr} ${monthStr}` };
    }

    async function render() {
        syncDatePicker();
        
        const container = document.getElementById('agenda-container');
        if (!container) return;

        let html = '<table class="agenda-table" style="table-layout: fixed; width: 100%; border-collapse: collapse;">';

        // 1. THEAD (Intestazioni Giorni)
        html += '<thead><tr>';
        html += '<th class="agenda-time-col" style="border-right: 2px solid var(--color-wood-200); z-index: 15; width: 80px; position: sticky; left: 0; background: var(--color-black-100);">Ore</th>';
        
        const weekDates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() + i);
            weekDates.push(date);

            const isToday = date.getTime() === today.getTime();
            const formatted = formatShortDate(date);
            const displayName = isToday ? 'OGGI' : formatted.name;
            
            html += `
                <th class="${isToday ? 'today' : ''}" style="width: calc((100% - 80px) / 7);">
                    <div class="agenda-day-name">${displayName}</div>
                    <div class="agenda-day-date">${formatted.date}</div>
                </th>
            `;
        }
        html += '</tr></thead>';

        // 2. TBODY (Righe con step basati sull'intervallo strettamente all'interno di [startHour, endHour))
        html += '<tbody>';
        
        const startMinTotal = startHour * 60;
        const endMinTotal = endHour * 60;
        
        for (let currentMin = startMinTotal; currentMin < endMinTotal; currentMin += interval) {
            const hour = Math.floor(currentMin / 60);
            const minutes = currentMin % 60;
            const isFullHour = minutes === 0;
            const timeStr = hour.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
            
            html += '<tr style="height: 110px;">';
            
            // Colonna dell'ora (mostra l'ora solo alla prima riga, altrimenti i minuti o vuoto)
            html += `<td class="agenda-time-col" style="border-right: 2px solid var(--color-wood-200); vertical-align: top; border-bottom: ${isFullHour ? '1px solid rgba(139, 90, 43, 0.2)' : '1px dashed rgba(139, 90, 43, 0.1)'}; position: sticky; left: 0; background: var(--color-black-100); font-size: ${isFullHour ? '1rem' : '0.75rem'}; color: ${isFullHour ? 'var(--color-text-cream)' : 'var(--color-text-muted)'}; padding: 4px;">${timeStr}</td>`;

            // Celle dei 7 giorni per questa fascia oraria
            for (let day = 0; day < 7; day++) {
                const cellDate = weekDates[day];
                const cellDateStr = cellDate.getFullYear() + '-' + (cellDate.getMonth()+1).toString().padStart(2, '0') + '-' + cellDate.getDate().toString().padStart(2, '0');
                const cellId = `agenda-cell-${cellDateStr}-${timeStr.replace(':', '-')}`;
                
                html += `<td class="agenda-cell" id="${cellId}" style="border-bottom: ${isFullHour ? '1px solid rgba(139, 90, 43, 0.2)' : '1px dashed rgba(139, 90, 43, 0.1)'}; padding: 2px; vertical-align: top; position: relative;"></td>`;
            }
            
            html += '</tr>';
        }
        html += '</tbody></table>';

        container.innerHTML = html;
        
        // Dopo aver disegnato la griglia vuota, popolala con gli appuntamenti
        await popolaAppuntamenti(weekDates);
    }

    async function popolaAppuntamenti(weekDates) {
        if (!window.FranklinApp || !window.FranklinApp.Storage) return;
        
        let appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
        const servizi = await window.FranklinApp.Storage.ottieniServizi();
        const barbieri = await window.FranklinApp.Storage.ottieniBarbieri();
        
        // Array di date valide come stringhe YYYY-MM-DD
        const validDates = weekDates.map(d => d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0'));
        
        // Filtra appuntamenti solo per le date visibili e per il barbiere scelto
        appuntamenti = appuntamenti.filter(a => {
            if (a.stato === 'cancellato') return false;
            if (a.barbiereId !== selectedBarber) return false;
            return validDates.includes(a.data);
        });
        
        // Colori fissi per i barbieri per distinguerli (fallback)
        const coloriBarbieri = [
            'linear-gradient(135deg, rgba(38,38,38,0.9), rgba(139,90,43,0.8))', // Wood
            'linear-gradient(135deg, rgba(38,38,38,0.9), rgba(47,79,79,0.8))',  // Green
            'linear-gradient(135deg, rgba(38,38,38,0.9), rgba(184,134,11,0.8))' // Brass
        ];
        
        appuntamenti.forEach(app => {
            const durata = app.servizioDurata ? parseInt(app.servizioDurata) : 30; // Minuti
            const barbiere = barbieri.find(b => b.id === app.barbiereId);
            const nomeBarbiere = barbiere ? barbiere.nome.split(' ')[0] : 'Barbiere';
            
            // Arrotondiamo la durata al prossimo multiplo dell'intervallo
            const blocksNeeded = Math.ceil(durata / interval);
            
            // Troviamo la cella di partenza esatta
            let cellId = `agenda-cell-${app.data}-${app.ora.replace(':', '-')}`;
            let startCell = document.getElementById(cellId);
            
            // Se non trova la cella (es. appuntamento alle 10:15 ma griglia a 30 min), cerchiamo lo slot precedente
            if (!startCell) {
                const parts = app.ora.split(':');
                if (parts.length === 2) {
                    let h = parseInt(parts[0]);
                    let m = parseInt(parts[1]);
                    // Arrotonda i minuti all'intervallo inferiore
                    m = Math.floor(m / interval) * interval;
                    const fallbackTimeStr = h.toString().padStart(2, '0') + '-' + m.toString().padStart(2, '0');
            cellId = `agenda-cell-${app.data}-${fallbackTimeStr}`;
                    startCell = document.getElementById(cellId);
                }
            }
            
            if (startCell) {
                const statoStr = (app.stato || 'Confermato').toLowerCase();
                let isRichiesta = (statoStr === 'richiesto' || statoStr === 'in_attesa');
                let isCompletato = (statoStr === 'completato');
                
                // Controlla se l'appuntamento è nel passato
                const [hOra, mOra] = app.ora.split(':').map(Number);
                const appDate = new Date(app.data);
                appDate.setHours(hOra, mOra + durata, 0, 0); // Fine dell'appuntamento
                
                const timePassed = appDate < new Date();
                let isNonConfermato = isRichiesta && timePassed;
                
                if (!isCompletato && !isRichiesta && timePassed) {
                    isCompletato = true;
                }
                
                let bg;
                let borderStyle;
                if (isCompletato) {
                    // Celestina per Completato
                    bg = 'linear-gradient(135deg, rgba(30, 80, 160, 0.96), rgba(15, 45, 100, 0.96))';
                    borderStyle = '1px solid #42a5f5';
                } else if (isNonConfermato) {
                    // Grigio per Non Confermato (richiesta scaduta)
                    bg = 'linear-gradient(135deg, rgba(90, 90, 90, 0.96), rgba(60, 60, 60, 0.96))';
                    borderStyle = '1px solid #9e9e9e';
                } else if (isRichiesta) {
                    // Pastello scuro ambra / senape per Richiesta
                    bg = 'linear-gradient(135deg, rgba(88, 72, 28, 0.96), rgba(64, 50, 18, 0.96))';
                    borderStyle = '1px solid #b89428';
                } else {
                    // Pastello scuro salvia / verde bosco per Confermato
                    bg = 'linear-gradient(135deg, rgba(34, 66, 44, 0.96), rgba(20, 48, 30, 0.96))';
                    borderStyle = '1px solid #3c824e';
                }
                
                // Tasti piccoli e laterali in basso a destra:
                let pulsantiHtml = '';
                if (!isCompletato) {
                    const btnCommonStyle = 'width:24px; height:24px; min-width:24px; border-radius:4px; padding:0; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.5); font-size: 0.72rem; transition: transform 0.15s ease;';
                    
                    if (isRichiesta) {
                        pulsantiHtml = `
                            <button onclick="event.stopPropagation(); window.Agenda.cambiaStatoAppuntamento('${app.id}', 'Confermato')" 
                                    style="${btnCommonStyle} background:rgba(46,125,50,0.85); border:1px solid #4caf50;" 
                                    title="Accetta e Conferma">&#x2705;</button>
                            <button onclick="event.stopPropagation(); window.Agenda.cambiaStatoAppuntamento('${app.id}', 'Cancellato')" 
                                    style="${btnCommonStyle} background:rgba(180,40,40,0.85); border:1px solid #e53935;" 
                                    title="Rifiuta e Cancella">&#x274C;</button>`;
                    } else {
                        pulsantiHtml = `
                            <button onclick="event.stopPropagation(); window.Agenda.modificaAppuntamento('${app.id}')" 
                                    style="${btnCommonStyle} background:rgba(184,134,11,0.75); border:1px solid #c5a059;" 
                                    title="Modifica">&#x270F;&#xFE0F;</button>
                            <button onclick="event.stopPropagation(); window.Agenda.cambiaStatoAppuntamento('${app.id}', 'Cancellato')" 
                                    style="${btnCommonStyle} background:rgba(180,40,40,0.85); border:1px solid #e53935;" 
                                    title="Cancella">&#x1F5D1;&#xFE0F;</button>`;
                    }
                }

                // Punto esclamativo rosso ❗ in alto a destra se c'è una nota
                let noteHtml = '';
                if (app.note && app.note.trim() !== '') {
                    const escNote = app.note.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    noteHtml = `<span onclick="event.stopPropagation(); window.Agenda.mostraNota('${escNote}')" 
                                      style="position: absolute; top: 4px; right: 4px; cursor: pointer; color: #ff4444; font-weight: 900; font-size: 0.85rem; background: rgba(0,0,0,0.75); width: 19px; height: 19px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #ff4444; z-index: 25; box-shadow: 0 0 6px rgba(255,0,0,0.6);" 
                                      title="Clicca per leggere le note">❗</span>`;
                }
                
                const nomeServizio = app.servizioNome || 'Servizio';
                const cardHtml = `
                    <div class="vintage-card appointment-card stato-${statoStr}" style="
                        background: ${bg};
                        border: ${borderStyle};
                        padding: 6px 8px;
                        margin: 2px;
                        border-radius: 5px;
                        height: calc(100% - 4px);
                        overflow: hidden;
                        box-shadow: var(--shadow-sm);
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        z-index: 10;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    ">
                        ${noteHtml}
                        <div style="font-size: 0.84rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-cream); padding-right: ${app.note ? '22px' : '0'};">&#x1F464; ${app.clienteNome}</div>
                        <div style="font-size: 0.74rem; color: var(--color-text-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">&#x2702;&#xFE0F; ${nomeServizio}</div>
                        <div style="font-size: 0.74rem; color: var(--color-brass-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>&#x23F1;&#xFE0F; ${durata} min</strong></div>
                        <div style="font-size: 0.74rem; color: var(--color-text-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">&#x1F4DE; ${app.clienteTelefono || 'N/A'}</div>
                        <div style="font-size: 0.68rem; color: rgba(245,235,210,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic;">Da: ${app.inseritoDa || (isRichiesta ? 'Cliente' : 'Admin')}</div>
                        <div style="position: absolute; bottom: 5px; right: 5px; display: flex; gap: 4px; z-index: 20;">${pulsantiHtml}</div>
                    </div>
                `;
                
                // Impostiamo il rowspan e iniettiamo la card
                startCell.rowSpan = blocksNeeded;
                startCell.innerHTML = cardHtml;
                startCell.style.padding = '0';
                
                // Nascondi le celle coperte dal rowspan
                const colIndex = Array.from(startCell.parentElement.children).indexOf(startCell);
                let currentRow = startCell.parentElement;
                for (let i = 1; i < blocksNeeded; i++) {
                    currentRow = currentRow.nextElementSibling;
                    if (currentRow) {
                        const cellToRemove = currentRow.children[colIndex];
                        if (cellToRemove && cellToRemove.classList.contains('agenda-cell')) {
                            cellToRemove.style.display = 'none';
                        }
                    }
                }
            }
        });

        // Helper per renderizzare carte di occupazione non prenotabili
        function helperRenderCard(cellDateStr, rawStartOra, rawEndOra, title, subtitle, bgGradient, textMuted, borderStyle, isFullDay) {
            if (!rawStartOra || !rawEndOra) return;
            
            const gridStartStr = startHour.toString().padStart(2, '0') + ':00';
            const gridEndStr = endHour.toString().padStart(2, '0') + ':00';
            
            let effectiveStart = isFullDay ? gridStartStr : rawStartOra;
            let effectiveEnd = isFullDay ? gridEndStr : rawEndOra;
            
            // Clamping al range attualmente visibile nella tabella [gridStartStr, gridEndStr]
            if (effectiveStart < gridStartStr) effectiveStart = gridStartStr;
            if (effectiveEnd > gridEndStr) effectiveEnd = gridEndStr;
            
            const [h1, m1] = effectiveStart.split(':').map(Number);
            const [h2, m2] = effectiveEnd.split(':').map(Number);
            let durationMins = (h2 * 60 + m2) - (h1 * 60 + m1);
            
            if (durationMins <= 0) return; // L'evento ricade totalmente fuori dal range orario selezionato dall'utente
            
            const blocksNeeded = Math.ceil(durationMins / interval);
            let cellId = `agenda-cell-${cellDateStr}-${effectiveStart.replace(':', '-')}`;
            let startCell = document.getElementById(cellId);
            
            if (!startCell) {
                let h = h1;
                let m = Math.floor(m1 / interval) * interval;
                const fallbackTimeStr = h.toString().padStart(2, '0') + '-' + m.toString().padStart(2, '0');
                cellId = `agenda-cell-${cellDateStr}-${fallbackTimeStr}`;
                startCell = document.getElementById(cellId);
            }
            
            if (startCell && (!startCell.children || startCell.children.length === 0)) {
                const fasciaStr = isFullDay ? 'Giornata Intera' : `${rawStartOra} - ${rawEndOra}`;
                const subHtml = subtitle ? `<div style="font-size: 0.75rem; color: #ffffff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subtitle}</div>` : '';
                const cardHtml = `
                    <div class="vintage-card appointment-card" style="
                        background: ${bgGradient};
                        border: ${borderStyle};
                        padding: 6px;
                        margin: 2px;
                        border-radius: 4px;
                        height: calc(100% - 4px);
                        overflow: hidden;
                        box-shadow: var(--shadow-sm);
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        z-index: 11;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                        color: #ffffff;
                    ">
                        <div style="font-size: 0.85rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                        ${subHtml}
                        <div style="font-size: 0.75rem; color: #ffeb3b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>&#x23F1;&#xFE0F; ${fasciaStr}</strong></div>
                        <div style="font-size: 0.70rem; color: ${textMuted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: auto; font-style: italic;">Non disponibile</div>
                    </div>
                `;
                
                startCell.rowSpan = blocksNeeded;
                startCell.innerHTML = cardHtml;
                startCell.style.padding = '0';
                
                const colIndex = Array.from(startCell.parentElement.children).indexOf(startCell);
                let currentRow = startCell.parentElement;
                for (let i = 1; i < blocksNeeded; i++) {
                    currentRow = currentRow.nextElementSibling;
                    if (currentRow) {
                        const cellToRemove = currentRow.children[colIndex];
                        if (cellToRemove && cellToRemove.classList.contains('agenda-cell')) {
                            cellToRemove.style.display = 'none';
                        }
                    }
                }
            }
        }

        // 5. Card Grigie per Chiusura Negozio e Fuori Orario di Apertura
        const imp = await window.FranklinApp.Storage.ottieniImpostazioni();
        const orariMap = imp.orariLavoro || {};
        const mapGiorni = [6, 0, 1, 2, 3, 4, 5];
        const giorniNomi = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
        
        weekDates.forEach(d => {
            const dateStr = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
            const numGiorno = d.getDay();
            const nomeGiorno = giorniNomi[mapGiorni[numGiorno]];
            const orario = orariMap[nomeGiorno];
            
            const bgGrey = 'linear-gradient(135deg, rgba(55,55,55,0.92), rgba(35,35,35,0.92))';
            
            if (!orario || orario.chiuso) {
                helperRenderCard(dateStr, '00:00', '23:59', '🔒 CHIUSO', 'Chiusura Settimanale', bgGrey, '#cccccc', '1px solid #555555', true);
            } else {
                let ma = '', mc = '', pa = '', pc = '';
                if (orario.orarioMattina && orario.orarioMattina.includes('-')) {
                    const parts = orario.orarioMattina.split('-');
                    ma = parts[0]; mc = parts[1];
                }
                if (orario.orarioPomeriggio && orario.orarioPomeriggio.includes('-')) {
                    const parts = orario.orarioPomeriggio.split('-');
                    pa = parts[0]; pc = parts[1];
                }

                if (ma && '00:00' < ma) {
                    helperRenderCard(dateStr, '00:00', ma, '🔒 CHIUSO', 'Fuori Orario', bgGrey, '#cccccc', '1px solid #555555', false);
                }
                if (mc && pa && mc < pa) {
                    helperRenderCard(dateStr, mc, pa, '🔒 CHIUSO', 'Pausa Pranzo', bgGrey, '#cccccc', '1px solid #555555', false);
                }
                if (pc && pc < '23:59') {
                    helperRenderCard(dateStr, pc, '23:59', '🔒 CHIUSO', 'Fuori Orario', bgGrey, '#cccccc', '1px solid #555555', false);
                }
            }
        });

        // 6. Card Festivo (Rosse) e Imprevisto (Blu) per Giorni Eccezionali del Negozio
        const storeExceptions = imp.giorniEccezionali || [];
        storeExceptions.forEach(exc => {
            if (!validDates.includes(exc.data)) return;
            
            const tipo = exc.tipo || (exc.motivo && exc.motivo.toLowerCase().includes('imprevisto') ? 'Imprevisto' : 'Giorno Festivo');
            let sOra = exc.interaGiornata ? '00:00' : exc.dalle;
            let eOra = exc.interaGiornata ? '23:59' : exc.alle;
            
            if (tipo === 'Imprevisto') {
                const bgBlue = 'linear-gradient(135deg, rgba(30,80,160,0.95), rgba(15,45,100,0.95))';
                helperRenderCard(exc.data, sOra, eOra, `⚠️ IMPREVISTO`, exc.motivo, bgBlue, '#bbdefb', '1px solid #42a5f5', exc.interaGiornata);
            } else {
                const bgRed = 'linear-gradient(135deg, rgba(165,42,42,0.95), rgba(120,20,20,0.95))';
                helperRenderCard(exc.data, sOra, eOra, `🎉 FESTIVO`, exc.motivo, bgRed, '#ffcdd2', '1px solid #ef5350', exc.interaGiornata);
            }
        });

        // 7. Renderizziamo anche le richieste (Ferie, Malattia, Permessi, Imprevisti) dei Barbieri come carte rosse
        barbieri.forEach(b => {
            if (selectedBarber && selectedBarber !== 'tutti' && b.id !== selectedBarber) return;
            
            const eccezioni = b.giorniEccezionali || [];
            eccezioni.forEach(exc => {
                if (!validDates.includes(exc.data)) return;
                
                let sOra = exc.interaGiornata ? '00:00' : exc.dalle;
                let eOra = exc.interaGiornata ? '23:59' : exc.alle;
                
                const bgRed = 'linear-gradient(135deg, rgba(165,42,42,0.95), rgba(120,20,20,0.95))';
                helperRenderCard(exc.data, sOra, eOra, `🚨 ${exc.motivo.toUpperCase()}`, `👨‍✂️ ${b.nome}`, bgRed, '#ffcdd2', '1px solid #ff4d4d', exc.interaGiornata);
            });
        });
    }

    function cellaCliccata(dateStr, timeStr) {
        console.log(`Cella cliccata: Data ${dateStr}, Ora ${timeStr}`);
        if (window.FranklinApp && window.FranklinApp.Admin) {
            const dateInput = document.getElementById('nuovo-appuntamento-data');
            if (dateInput) {
                dateInput.value = dateStr;
            }
            window.FranklinApp.Admin.apriModaleNuovoAppuntamento();
        }
    }

    async function cambiaStatoAppuntamento(id, nuovoStato) {
        if (!window.FranklinApp || !window.FranklinApp.Storage) return;
        
        try {
            if (nuovoStato === 'Cancellato') {
                await window.FranklinApp.Storage.eliminaAppuntamento(id);
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast(`Appuntamento eliminato!`, 'successo');
                }
            } else {
                const payload = { stato: nuovoStato };
                if (nuovoStato === 'Confermato') {
                    const appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
                    const app = appuntamenti.find(a => a.id === id);
                    if (app && app.inseritoDa === 'Cliente') {
                        const u = await window.FranklinApp.Auth.getUtenteLoggato();
                        const nomeUtente = u ? `${u.nome || ''} ${u.cognome || ''}`.trim() || u.username : 'Admin';
                        payload.confermatoDa = nomeUtente;
                    }
                }
                await window.FranklinApp.Storage.aggiornaAppuntamento(id, payload);
                if (window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
                    window.FranklinApp.Admin.mostraToast(`Appuntamento ${nuovoStato.toLowerCase()}!`, 'successo');
                }
            }
            await render();
            
            if (window.FranklinApp.Admin && typeof window.FranklinApp.Admin.mostraToast === 'function') {
                window.FranklinApp.Admin.mostraToast(
                    nuovoStato === 'cancellato' ? 'Appuntamento cancellato' : 'Appuntamento confermato', 
                    nuovoStato === 'cancellato' ? 'errore' : 'successo'
                );
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function modificaAppuntamento(appId) {
        if (!window.FranklinApp || !window.FranklinApp.Storage) return;
        
        const appuntamenti = await window.FranklinApp.Storage.ottieniAppuntamenti();
        const app = appuntamenti.find(a => a.id === appId);
        if (!app) return;
        
        // Apri il modale di nuovo appuntamento
        if (window.FranklinApp.Admin) {
            await window.FranklinApp.Admin.apriModaleNuovoAppuntamento();
            
            // Pre-compila i campi con i dati esistenti
            var selectServizio = document.getElementById('nuovo-appuntamento-servizio');
            var selectBarbiere = document.getElementById('nuovo-appuntamento-barbiere');
            var dateInput = document.getElementById('nuovo-appuntamento-data');
            var nomeInput = document.getElementById('nuovo-appuntamento-cliente');
            var telInput = document.getElementById('nuovo-appuntamento-telefono');
            
            // PRIMA di tutto: salviamo l'ID dell'appuntamento in modifica
            // così ricalcolaOrari() sa di escluderlo dal calcolo overlap
            var modal = document.getElementById('modale-nuovo-appuntamento');
            if (modal) modal.dataset.editingId = appId;
            
            // Cambiamo il titolo del modale
            var titoloModale = document.querySelector('#modale-nuovo-appuntamento h2, #modale-nuovo-appuntamento .vintage-title');
            if (titoloModale) titoloModale.textContent = 'Modifica Appuntamento';
            
            if (selectServizio) {
                const servizi = await window.FranklinApp.Storage.ottieniServizi();
                const srv = servizi.find(s => s.nome === app.servizioNome);
                if (srv) selectServizio.value = srv.id;
            }
            if (selectBarbiere) selectBarbiere.value = app.barbiereId;
            if (dateInput) dateInput.value = app.data;
            if (nomeInput) nomeInput.value = app.clienteNome;
            if (telInput) telInput.value = app.clienteTelefono || '';
            
            // ORA ricalcoliamo gli orari (con l'esclusione attiva)
            if (window.FranklinApp.Admin.ricalcolaOrari) {
                await window.FranklinApp.Admin.ricalcolaOrari();
            }
            
            // Dopo il ricalcolo, settiamo l'ora
            var selectOra = document.getElementById('nuovo-appuntamento-ora');
            if (selectOra) selectOra.value = app.ora;
        }
    }

    function mostraNota(noteText) {
        if (window.FranklinApp && window.FranklinApp.Admin && window.FranklinApp.Admin.mostraToast) {
            window.FranklinApp.Admin.mostraToast("📝 Note Appuntamento: " + noteText, "info");
        } else {
            alert("📝 Note inserite per questo appuntamento:\n\n" + noteText);
        }
    }

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', init);

    return {
        cambiaGiorno,
        vaiAOggi,
        vaiAData,
        cambiaRangeOrario,
        cambiaFiltri,
        cellaCliccata,
        render,
        cambiaStatoAppuntamento,
        modificaAppuntamento,
        mostraNota
    };
})();

