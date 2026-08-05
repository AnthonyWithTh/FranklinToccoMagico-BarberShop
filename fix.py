import re

with open('js/agenda.js', 'r', encoding='utf-8') as f:
    content = f.read()

correct_render = """    function render() {
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

        // 2. TBODY (Righe con step basati sull'intervallo)
        html += '<tbody>';
        
        // Calcola quante righe per ora
        const stepsPerHour = 60 / interval;
        
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let step = 0; step < stepsPerHour; step++) {
                const minutes = step * interval;
                html += '<tr style="height: 110px;">';
                
                // Colonna dell'ora (mostra l'ora solo alla prima riga, altrimenti i minuti o vuoto)
                const isFullHour = step === 0;
                const timeStr = hour.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
                
                html += `<td class="agenda-time-col" style="border-right: 2px solid var(--color-wood-200); vertical-align: top; border-bottom: ${isFullHour ? '1px solid rgba(139, 90, 43, 0.2)' : '1px dashed rgba(139, 90, 43, 0.1)'}; position: sticky; left: 0; background: var(--color-black-100); font-size: ${isFullHour ? '1rem' : '0.75rem'}; color: ${isFullHour ? 'var(--color-text-cream)' : 'var(--color-text-muted)'}; padding: 4px;">${timeStr}</td>`;

                // Celle dei 7 giorni per questa fascia oraria
                for (let day = 0; day < 7; day++) {
                    const cellDate = weekDates[day];
                    const cellDateStr = cellDate.getFullYear() + '-' + (cellDate.getMonth()+1).toString().padStart(2, '0') + '-' + cellDate.getDate().toString().padStart(2, '0');
                    const cellId = `agenda-cell-${cellDateStr}-${timeStr.replace(':', '-')}`;
                    
                    html += `<td class="agenda-cell" id="${cellId}" onclick="Agenda.cellaCliccata('${cellDateStr}', '${timeStr}')" style="border-bottom: ${isFullHour ? '1px solid rgba(139, 90, 43, 0.2)' : '1px dashed rgba(139, 90, 43, 0.1)'}; padding: 2px; vertical-align: top; position: relative;"></td>`;
                }
                
                html += '</tr>';
            }
        }
        html += '</tbody></table>';

        container.innerHTML = html;
        
        // Dopo aver disegnato la griglia vuota, popolala con gli appuntamenti
        popolaAppuntamenti(weekDates);
    }"""

new_content = re.sub(r'    function render\(\) \{.*?    function popolaAppuntamenti\(weekDates\) \{', correct_render + '\n\n    function popolaAppuntamenti(weekDates) {', content, flags=re.DOTALL)
with open('js/agenda.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
