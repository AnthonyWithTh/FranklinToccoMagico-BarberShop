import re

html_path = 'admin/barbers.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Gestione Orari Barbiere section
new_section = """                <!-- Gestione Orari Barbiere -->
                <div class="vintage-card admin-form">
                    <div id="pannello-orari-barbiere">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="color: var(--color-text-cream); margin: 0; font-family: var(--font-vintage);">Ferie, Malattia, Permessi e Imprevisti</h4>
                            <button type="button" class="btn-primary" onclick="apriModaleEccezioneBarbiere()">+ Aggiungi</button>
                        </div>
                        
                        <table class="orari-editor admin-tabella" style="width: 100%; margin-bottom: 0;">
                            <thead>
                                <tr>
                                    <th>Barbiere</th>
                                    <th>Data</th>
                                    <th>Motivo</th>
                                    <th>Giornata Intera</th>
                                    <th>Dalle</th>
                                    <th>Alle</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="eccezionali-tbody">
                                <!-- Popolato da JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        
            <!-- Modale Eccezione Barbiere -->
            <div id="modale-eccezione-barbiere" class="modal-overlay" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000;">
                <div class="modal-content vintage-card admin-form" style="width: 90%; max-width: 500px; padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 id="modale-eccezione-barbiere-titolo" class="vintage-title" style="margin: 0; text-align: center;">Aggiungi Richiesta</h2>
                        <button onclick="chiudiModaleEccezioneBarbiere()" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    
                    <form id="form-eccezione-barbiere" onsubmit="event.preventDefault(); salvaGiornoEccezionaleBarbiere();">
                        <input type="hidden" id="eccezione-barbiere-old-data">
                        <input type="hidden" id="eccezione-barbiere-old-id">
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="vintage-label">Barbiere</label>
                            <div id="eccezione-barbiere-select-container"></div>
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="vintage-label">Data</label>
                            <input type="date" id="eccezione-barbiere-data" class="vintage-input" required onchange="ricalcolaModaleEccezioneBarbiere()" disabled>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="vintage-label">Motivo</label>
                            <select id="eccezione-barbiere-motivo" class="vintage-select" required disabled>
                                <option value="Ferie">Ferie</option>
                                <option value="Malattia">Malattia</option>
                                <option value="Permesso">Permesso</option>
                                <option value="Imprevisto">Imprevisto</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="eccezione-barbiere-intera" class="check-chiuso" disabled onchange="ricalcolaModaleEccezioneBarbiere()" style="width: auto; margin: 0;">
                            <label class="vintage-label" style="margin: 0;">Giornata Intera</label>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="flex: 1;">
                                <label class="vintage-label">Dalle</label>
                                <select id="eccezione-barbiere-dalle" class="vintage-select" disabled onchange="ricalcolaModaleEccezioneBarbiere()">
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label class="vintage-label">Alle</label>
                                <select id="eccezione-barbiere-alle" class="vintage-select" disabled>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" class="btn-secondary" onclick="chiudiModaleEccezioneBarbiere()">Annulla</button>
                            <button type="submit" class="btn-primary">Salva</button>
                        </div>
                    </form>
                </div>
            </div>"""

start_marker = '<!-- Gestione Orari Barbiere -->'
end_marker = '<!-- Modale Barbiere -->'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_section + "\n            " + content[end_idx:]
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("HTML updated.")
else:
    print("Markers not found.")
