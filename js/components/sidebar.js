
(function() {
    // Genera l'HTML della sidebar dinamicamente in base ai permessi
    function generaSidebar() {
        let canView = (page) => true; // Momentaneamente mostriamo tutto finché Auth non gestisce RBAC client-side (o si può implementare un controllo asincrono successivo)

        let usernameDisplay = `
            <a href="personale.html" class="nav-link" id="nav-personale" style="text-decoration: none; cursor: pointer;">
                <span class="icon">👤</span><span class="text" id="sidebar-username" style="color: var(--color-brass-light);">Caricamento...</span>
            </a>
        `;

        const links = [
            { id: 'nav-appointments', url: 'appointments.html', icon: '📅', text: 'Agenda', perm: 'appointments' },
            { id: 'nav-services', url: 'services.html', icon: '✂️', text: 'Servizi', perm: 'services' },
            { id: 'nav-schedule', url: 'schedule.html', icon: '🕒', text: 'Orario di Lavoro', perm: 'schedule' },
            { id: 'nav-barbers', url: 'barbers.html', icon: '💈', text: 'Staff', perm: 'barbers' },
            { id: 'nav-storico', url: 'storico.html', icon: '⏳', text: 'Storico', perm: 'storico' },
            { id: 'nav-users', url: 'users.html', icon: '👤', text: 'Amministrazione', perm: 'users' },
            { id: 'nav-vetrina', url: 'vetrina.html', icon: '🌐', text: 'Vetrina', perm: 'vetrina' },
            { id: 'nav-settings', url: 'settings.html', icon: '⚙️', text: 'Impostazioni', perm: 'settings' }
        ];

        let navHTML = '';
        links.forEach(link => {
            if (canView(link.perm)) {
                navHTML += `
                    <a href="${link.url}" class="nav-link" id="${link.id}" style="display: none;">
                        <span class="icon">${link.icon}</span><span class="text">${link.text}</span>
                    </a>
                `;
            }
        });

        return `
            <aside class="sidebar wood-panel sidebar-open" id="admin-sidebar">
                <div class="sidebar-header" style="display: flex; align-items: center; gap: 15px; padding: 10px 0;">
                    <h2 class="vintage-title brass-text logo-icon" style="font-size: 2rem; margin: 0; min-width: 30px; text-align: center;">F</h2>
                    <div class="logo-text" style="line-height: 1.2;">
                        <h2 class="vintage-title brass-text" style="font-size: 1.3rem; margin: 0; white-space: nowrap;">FRANKLIN</h2>
                        <div style="font-size: 0.6rem; letter-spacing: 2px; color: var(--color-brass-base); white-space: nowrap;">BARBER SHOP</div>
                    </div>
                </div>
                <div class="brass-divider" style="margin: 1rem 0;"></div>
                
                <nav style="display: flex; flex-direction: column; flex: 1; margin-top: 1rem;">
                    ${navHTML}
                    
                    <div style="margin-top: auto;">
                        <div class="brass-divider" style="margin-bottom: 1rem;"></div>
                        ${usernameDisplay}
                        <button class="nav-link" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: var(--spacing-sm);" onclick="if(window.FranklinApp && window.FranklinApp.Auth) window.FranklinApp.Auth.logout(); else window.location.href='login.html';">
                            <span class="icon">🚪</span><span class="text">Esci</span>
                        </button>
                    </div>
                </nav>
            </aside>
        `;
    }

    document.write(generaSidebar());

    function bindSidebarEvents() {
        const sidebar = document.getElementById('admin-sidebar');
        if (!sidebar) return;
        
        let closeTimeout = null;
        let isMouseInside = false;

        function closeSidebar() {
            if (!isMouseInside) {
                sidebar.classList.remove('sidebar-open');
            }
        }

        function openSidebar() {
            sidebar.classList.add('sidebar-open');
            if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
            }
        }

        // 1. Timer iniziale di 0.5 secondi al caricamento pagina
        closeTimeout = setTimeout(() => {
            closeSidebar();
        }, 500);

        // 2. Mouse entra: tieni aperta e cancella timeout
        sidebar.addEventListener('mouseenter', () => {
            isMouseInside = true;
            openSidebar();
        });

        // 3. Mouse esce: aspetta 0.5 secondi prima di chiudere
        sidebar.addEventListener('mouseleave', () => {
            isMouseInside = false;
            closeTimeout = setTimeout(() => {
                closeSidebar();
            }, 500);
        });

        // 4. Click al di fuori: chiudi immediatamente (se il mouse non è sopra)
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target)) {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
                closeSidebar();
            }
        });

        // Highlight active page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const pageIdMap = {
            'index.html': 'nav-appointments',
            'appointments.html': 'nav-appointments',
            'services.html': 'nav-services',
            'schedule.html': 'nav-schedule',
            'barbers.html': 'nav-barbers',
            'settings.html': 'nav-settings',
            'users.html': 'nav-users',
            'personale.html': 'nav-personale',
            'vetrina.html': 'nav-vetrina'
        };
        
        const activeId = pageIdMap[currentPage];
        if (activeId) {
            const activeLink = document.getElementById(activeId);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    // Carica asincronamente il nome utente e aggiorna la sidebar
    async function initSidebarUser() {
        try {
            if (window.FranklinApp && window.FranklinApp.Storage) {
                const sb = window.FranklinApp.Storage.supabase;
                if (sb) {
                    const { data: { user }, error } = await sb.auth.getUser();
                    const span = document.getElementById('sidebar-username');
                    
                    if (error) {
                        console.error("Errore getUser sidebar:", error);
                        if (span) span.textContent = 'Errore sessione';
                        return;
                    }
                    
                    
                    if (user) {
                        if (span) {
                            // Recupera il vero username e ruolo dalla tabella utenti
                            const { data: profilo } = await sb.from('utenti').select('username, ruoloid').eq('id', user.id).single();
                            span.textContent = (profilo && profilo.username) ? profilo.username : (user.user_metadata?.display_name || user.email);
                            
                            // Applica i permessi RBAC
                            if (profilo && profilo.ruoloid) {
                                const { data: ruolo } = await sb.from('ruoli').select('permessi').eq('id', profilo.ruoloid).single();
                                if (ruolo && ruolo.permessi) {
                                    const linksPerm = [
                                        { id: 'nav-appointments', perm: 'appointments' },
                                        { id: 'nav-services', perm: 'services' },
                                        { id: 'nav-schedule', perm: 'schedule' },
                                        { id: 'nav-barbers', perm: 'barbers' },
                                        { id: 'nav-users', perm: 'users' },
                                        { id: 'nav-vetrina', perm: 'vetrina' },
                                        { id: 'nav-settings', perm: 'settings' }
                                    ];
                                    linksPerm.forEach(l => {
                                        const el = document.getElementById(l.id);
                                        if (el && ruolo.permessi.includes(l.perm)) {
                                            el.style.display = 'flex';
                                        }
                                    });
                                }
                            }
                        }
                    } else {
                        if (span) span.textContent = 'Non loggato';
                    }
                }
            }
        } catch (e) {
            console.error("Eccezione in initSidebarUser:", e);
        }
    }
    function initSidebar() {
        bindSidebarEvents();
        initSidebarUser();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();
