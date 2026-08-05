window.FranklinApp = window.FranklinApp || {};

FranklinApp.Pubblico = {
  carouselState: {
    tuttiServizi: [],
    servizi: [],
    categoriaSelezionata: 'tutti',
    currentIndex: 0,
    autoPlayTimer: null,
    isHovered: false
  },

  barberCarouselState: {
    barbieri: [],
    currentIndex: 0,
    timer: null
  },

  async inizializza() {
    await window.FranklinApp.Storage.inizializza();
    await this.renderServizi();
    await this.renderFooter();
    this.setupNavbar();
    this.setupSmoothScroll();
    this.setupCarouselEvents();
    
    document.addEventListener('DOMContentLoaded', () => {
      document.body.addEventListener('click', (e) => {
        if (e.target.matches('.btn-prenota')) {
          const srvId = e.target.getAttribute('data-id');
          this.apriPrenotazione(srvId);
        }
      });
    });
  },

  async renderServizi() {
    const serviziData = await window.FranklinApp.Storage.ottieniServizi();
    this.carouselState.tuttiServizi = serviziData.filter(s => s.attivo !== false);
    this.popolaFiltroCategorie();
    this.filtraServiziPerCategoria(this.carouselState.categoriaSelezionata || 'tutti');
  },

  popolaFiltroCategorie() {
    const select = document.getElementById('filtro-categoria-servizi');
    if (!select) return;

    select.innerHTML = `
      <option value="tutti">Tutte le Categorie</option>
      <option value="capelli">Capelli</option>
      <option value="barba">Barba</option>
      <option value="trattamenti">Trattamenti</option>
      <option value="combo">Combo</option>
    `;
    select.value = this.carouselState.categoriaSelezionata || 'tutti';
  },

  filtraServiziPerCategoria(cat) {
    this.carouselState.categoriaSelezionata = cat;
    if (cat === 'tutti') {
      this.carouselState.servizi = [...this.carouselState.tuttiServizi];
    } else {
      this.carouselState.servizi = this.carouselState.tuttiServizi.filter(s => 
        (s.categoria || '').toLowerCase().includes(cat.toLowerCase())
      );
    }
    this.carouselState.currentIndex = 0;
    this.costruisciCarouselDOM();
  },

  costruisciCarouselDOM() {
    const container = document.getElementById('servizi-container');
    const btnPrenota = document.getElementById('btn-prenota-selezionato');
    if (!container) return;

    const servizi = this.carouselState.servizi;

    if (servizi.length === 0) {
      container.innerHTML = '<div style="color: var(--color-text-muted); text-align: center; width: 100%; font-size: 1.1rem; padding: 2rem;">Nessun servizio disponibile per questa categoria.</div>';
      if (btnPrenota) btnPrenota.style.display = 'none';
      this.stopAutoPlay();
      return;
    }

    let html = '';
    servizi.forEach((s, idx) => {
      const bgImg = (s.immagine && s.immagine.trim()) ? s.immagine : 'assets/images/hero-bg.jpg';
      html += `
        <div class="servizio-card" id="carousel-card-${idx}"
             style="background-image: linear-gradient(rgba(18, 18, 18, 0.75), rgba(18, 18, 18, 0.92)), url('${bgImg}');"
             onclick="FranklinApp.Pubblico.selezionaServizioCarosello(${idx})">
          
          <div class="card-categoria-box">
            <span style="font-family: var(--font-admin); font-size: 0.78rem; text-transform: uppercase; color: var(--color-brass-base); letter-spacing: 0.1em; font-weight: 600;">${s.categoria || 'Servizio'}</span>
          </div>

          <div class="card-titolo-box">
            <h3>${s.nome}</h3>
          </div>

          <div class="card-descrizione-box">
            <p>${s.descrizione || 'Servizio di alta qualità curato nei dettagli per il tuo stile.'}</p>
          </div>

          <div class="card-prezzo-box">
            <div class="card-durata-tag">
              <span>⏱️</span>
              <span>${s.durata} min</span>
            </div>
            <div class="card-prezzo-tag">
              €${Number(s.prezzo).toFixed(2)}
            </div>
          </div>

        </div>
      `;
    });

    container.innerHTML = html;
    this.updateCarouselPositions();
    this.startAutoPlay();
  },

  updateCarouselPositions() {
    const servizi = this.carouselState.servizi;
    const N = servizi.length;
    if (N === 0) return;

    const currIdx = (this.carouselState.currentIndex + N) % N;
    const btnPrenota = document.getElementById('btn-prenota-selezionato');

    servizi.forEach((s, idx) => {
      const cardEl = document.getElementById(`carousel-card-${idx}`);
      if (!cardEl) return;

      let offset = idx - currIdx;
      // Infinite circular wrapping logic
      if (offset > N / 2) offset -= N;
      if (offset < -N / 2) offset += N;

      const rawImg = s.immagine || 'assets/images/hero-bg.jpg';
      const bgImg = window.FranklinApp.Storage.fixImagePath(rawImg, false);

      if (offset === 0) {
        // Card centrale attiva: 100% nitida, massima opacità (0% trasparenza)
        cardEl.className = 'servizio-card active-card';
        cardEl.style.transform = 'translateX(0px) scale(1.15) translateZ(30px)';
        cardEl.style.filter = 'grayscale(0%) opacity(1)';
        cardEl.style.opacity = '1';
        cardEl.style.backgroundImage = `linear-gradient(rgba(10, 10, 10, 0.3), rgba(10, 10, 10, 0.8)), url('${bgImg}')`;
        cardEl.style.zIndex = '10';
        cardEl.style.pointerEvents = 'auto';
      } else if (offset === -1 || (N === 2 && offset === 1 && currIdx === 1)) {
        // Card laterale sinistra: mostra solo la foto senza testi
        cardEl.className = 'servizio-card side-card';
        cardEl.style.transform = 'translateX(-320px) scale(0.88) translateZ(-40px)';
        cardEl.style.filter = 'grayscale(15%) opacity(0.7)';
        cardEl.style.opacity = '0.7';
        cardEl.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.2), rgba(18, 18, 18, 0.4)), url('${bgImg}')`;
        cardEl.style.zIndex = '5';
        cardEl.style.pointerEvents = 'auto';
      } else if (offset === 1) {
        // Card laterale destra: mostra solo la foto senza testi
        cardEl.className = 'servizio-card side-card';
        cardEl.style.transform = 'translateX(320px) scale(0.88) translateZ(-40px)';
        cardEl.style.filter = 'grayscale(15%) opacity(0.7)';
        cardEl.style.opacity = '0.7';
        cardEl.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.2), rgba(18, 18, 18, 0.4)), url('${bgImg}')`;
        cardEl.style.zIndex = '5';
        cardEl.style.pointerEvents = 'auto';
      } else {
        // Card fuori dal campo visivo principale
        cardEl.className = 'servizio-card side-card';
        const posX = offset > 0 ? 600 : -600;
        cardEl.style.transform = `translateX(${posX}px) scale(0.65) translateZ(-100px)`;
        cardEl.style.filter = 'grayscale(15%) opacity(0)';
        cardEl.style.opacity = '0';
        cardEl.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.2), rgba(18, 18, 18, 0.4)), url('${bgImg}')`;
        cardEl.style.zIndex = '0';
        cardEl.style.pointerEvents = 'none';
      }
    });

    if (btnPrenota) {
      btnPrenota.style.display = 'inline-block';
      btnPrenota.textContent = 'Prenota Ora';
    }
  },

  selezionaServizioCarosello(idx) {
    const N = this.carouselState.servizi.length;
    if (N === 0) return;
    this.carouselState.currentIndex = (idx + N) % N;
    this.updateCarouselPositions();
  },

  startAutoPlay() {
    this.stopAutoPlay();
    this.carouselState.autoPlayTimer = setInterval(() => {
      if (!this.carouselState.isHovered && this.carouselState.servizi.length > 1) {
        this.selezionaServizioCarosello(this.carouselState.currentIndex + 1);
      }
    }, 5000);
  },

  stopAutoPlay() {
    if (this.carouselState.autoPlayTimer) {
      clearInterval(this.carouselState.autoPlayTimer);
      this.carouselState.autoPlayTimer = null;
    }
  },

  prenotaServizioSelezionato() {
    const servizi = this.carouselState.servizi;
    const N = servizi.length;
    if (N === 0) return;
    const activeServ = servizi[(this.carouselState.currentIndex + N) % N];
    if (activeServ) {
      this.apriPrenotazione(activeServ.id);
    }
  },

  setupCarouselEvents() {
    const container = document.getElementById('servizi-container');
    const wrapper = document.querySelector('.carousel-wrapper') || container;
    if (!container) return;

    if (wrapper) {
      wrapper.addEventListener('mouseenter', () => {
        this.carouselState.isHovered = true;
      });

      wrapper.addEventListener('mouseleave', () => {
        this.carouselState.isHovered = false;
      });
    }

    let startX = 0;
    let isDragging = false;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) {
          this.selezionaServizioCarosello(this.carouselState.currentIndex + 1);
        } else {
          this.selezionaServizioCarosello(this.carouselState.currentIndex - 1);
        }
      }
    }, { passive: true });

    container.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isDragging = true;
    });

    container.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = e.clientX - startX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) {
          this.selezionaServizioCarosello(this.carouselState.currentIndex + 1);
        } else {
          this.selezionaServizioCarosello(this.carouselState.currentIndex - 1);
        }
      }
    });

    container.addEventListener('mouseleave', () => {
      isDragging = false;
    });
  },

  setupNavbar() {
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (nav) {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      }
    });

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
  },

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  },

  async apriPrenotazione(servizioId = null) {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'flex';
      await window.FranklinApp.Prenotazione.inizializza();
      if (servizioId) {
        window.FranklinApp.Prenotazione.selezionaServizio(servizioId);
      }
    }
  },

  chiudiPrenotazione() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
      modal.style.display = 'none';
      window.FranklinApp.Prenotazione.reset();
    }
  },

  mostraToast(messaggio, tipo = 'successo') {
    const toastContainer = document.getElementById('toast-container') || this.creaToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast-notification`;
    toast.innerText = messaggio;
    toast.style.borderColor = 'var(--color-brass-base)';
    if (tipo === 'successo') {
      toast.style.backgroundColor = 'var(--color-green-100)';
    } else {
      toast.style.backgroundColor = 'var(--color-danger)';
    }
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  creaToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
  },

  async renderFooter() {
    const imp = await window.FranklinApp.Storage.ottieniImpostazioni();
    const barbieriData = await window.FranklinApp.Storage.ottieniBarbieri();
    const barbieri = (barbieriData || []).filter(b => b.attivo !== false);
    
    // 1. Colonna 1: Chi Siamo (Carosello Barbieri)
    const colChiSiamo = document.getElementById('footer-col-chi-siamo');
    if (colChiSiamo) {
      this.barberCarouselState.barbieri = barbieri;
      this.stopBarberCarouselAutoPlay();

      const titoloChi = barbieri.length === 1 ? 'Chi Sono' : 'Chi Siamo';

      if (barbieri.length === 0) {
        colChiSiamo.innerHTML = `
          <h3 style="font-family: var(--font-heading); color: var(--color-brass-light); margin-bottom: 1rem;">${titoloChi}</h3>
          <p style="color: var(--color-text-muted);">Lo staff del nostro salone vintage.</p>
        `;
      } else {
        const mostraDots = barbieri.length > 1;
        colChiSiamo.innerHTML = `
          <h3 style="font-family: var(--font-heading); color: var(--color-brass-light); margin-bottom: 1rem;">${titoloChi}</h3>
          <div id="barber-carousel-container" style="position: relative; background: rgba(18, 18, 18, 0.6); border: 1px solid var(--color-brass-dark); border-radius: var(--border-radius-md); padding: 1.4rem; min-height: 220px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: opacity 0.4s ease-in-out;">
            <!-- Slide del barbiere iniettata qui -->
          </div>
          <div style="display: ${mostraDots ? 'flex' : 'none'}; justify-content: center; gap: 8px; margin-top: 10px;" id="barber-carousel-dots">
            <!-- Indicatori pallini iniettati qui -->
          </div>
        `;
        this.barberCarouselState.currentIndex = 0;
        this.renderBarberSlide(false);
        if (barbieri.length > 1) {
          this.startBarberCarouselAutoPlay();
        }
      }
    }

    // 2. Colonna 2: Orari
    const colOrari = document.getElementById('footer-col-orari');
    if (colOrari) {
      let htmlOrari = '<ul style="padding:0; list-style:none; margin:0;">';
      const orariMap = imp.orariLavoro || {};
      const giorni = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
      
      giorni.forEach(giorno => {
        const o = orariMap[giorno];
        const nomeGiorno = giorno.charAt(0).toUpperCase() + giorno.slice(1);
        if (!o || o.chiuso) {
          htmlOrari += `<li style="margin-bottom: 0.4rem; font-family: var(--font-body); font-size: 0.9rem;"><strong style="color: var(--color-brass-light);">${nomeGiorno}:</strong> <span style="color: var(--color-danger);">Chiuso</span></li>`;
        } else {
          let orarioStr = '';
          if (o.orarioMattina) {
            orarioStr += o.orarioMattina;
          }
          if (o.orarioPomeriggio) {
            if (orarioStr) orarioStr += ' | ';
            orarioStr += o.orarioPomeriggio;
          }
          htmlOrari += `<li style="margin-bottom: 0.4rem; font-family: var(--font-body); font-size: 0.9rem;"><strong style="color: var(--color-brass-light);">${nomeGiorno}:</strong> ${orarioStr || 'Aperto'}</li>`;
        }
      });
      htmlOrari += '</ul>';

      colOrari.innerHTML = `
        <h3 style="font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.3rem; margin-bottom: 1rem;">Orari di Apertura</h3>
        ${htmlOrari}
        <div style="margin-top: 0.8rem; font-family: var(--font-body); font-size: 0.9rem; color: var(--color-text-cream);">
          <strong style="color: var(--color-brass-light);">Giorni Festivi:</strong> A discrezione
        </div>
      `;
    }

    // 3. Colonna 2 (Centro): Dove Siamo e Social
    const colContattiLink = document.getElementById('footer-col-contatti-link');
    if (colContattiLink) {
      colContattiLink.innerHTML = `
        <h3 style="font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.3rem; margin-bottom: 1rem;">Dove siamo</h3>
        <ul style="list-style: none; padding: 0; margin-bottom: 1.2rem;">
          <li style="margin-bottom: 0.4rem; font-size: 0.92rem;">📍 ${imp.indirizzo || 'Via Roma 12, Milano'}</li>
          <li style="margin-bottom: 0.4rem; font-size: 0.92rem;">📞 ${imp.telefono || '+39 02 1234567'}</li>
          <li style="margin-bottom: 0.4rem; font-size: 0.92rem;">✉️ ${imp.email || 'info@franklinbarber.it'}</li>
        </ul>
        <h3 style="font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.3rem; margin-bottom: 1rem; margin-top: 1.5rem;">Social</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 0.4rem;"><a href="${(imp.social && imp.social.instagram) || '#'}" target="_blank" style="color: var(--color-text-cream); text-decoration: none;">📷 Instagram</a></li>
          <li style="margin-bottom: 0.4rem;"><a href="${(imp.social && imp.social.facebook) || '#'}" target="_blank" style="color: var(--color-text-cream); text-decoration: none;">📘 Facebook</a></li>
        </ul>
      `;
    }
  },

  renderBarberSlide(animate = true) {
    const container = document.getElementById('barber-carousel-container');
    const dotsContainer = document.getElementById('barber-carousel-dots');
    const barbieri = this.barberCarouselState.barbieri;
    if (!container || barbieri.length === 0) return;

    const idx = (this.barberCarouselState.currentIndex + barbieri.length) % barbieri.length;
    const b = barbieri[idx];

    let n = b.nome || '';
    let c = b.cognome || '';
    if (!c && n.includes(' ')) {
      const parti = n.split(' ');
      n = parti[0];
      c = parti.slice(1).join(' ');
    }
    const nomeCompleto = (n + ' ' + c).trim();
    const etaStr = b.eta ? ` (${b.eta})` : '';
    const fotoUrl = (b.foto && b.foto.trim()) ? b.foto : (b.ritratto && b.ritratto.trim()) ? b.ritratto : 'assets/images/barbiere-marco.jpg';

    const buildHTML = () => `
      <div style="display: flex; align-items: stretch; justify-content: space-between; gap: 1.2rem; width: 100%; text-align: left; min-height: 160px;">
        
        <!-- Testo a sinistra (giustificato a sinistra) -->
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; text-align: left;">
          <h4 style="font-family: var(--font-heading); color: var(--color-brass-light); font-size: 1.15rem; margin: 0 0 2px 0; line-height: 1.25;">
            ${nomeCompleto}${etaStr}
          </h4>
          <div style="font-family: var(--font-admin); font-size: 0.82rem; text-transform: uppercase; color: var(--color-brass-base); letter-spacing: 0.08em; margin-bottom: 0.5rem; font-weight: 600;">
            ${b.ruolo || 'Barbiere'}
          </div>
          <p style="font-family: var(--font-body); font-size: 0.85rem; color: var(--color-text-cream); margin: 0; line-height: 1.45; text-align: left; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;">
            ${b.descrizione || 'Esperto barbiere e stilista del nostro salone.'}
          </p>
        </div>

        <!-- Immagine a destra con cornice quadrata che riempie tutta l'altezza -->
        <div style="flex: 0 0 130px; width: 130px; display: flex; align-items: stretch;">
          <img src="${fotoUrl}" alt="${nomeCompleto}" style="width: 100%; height: 100%; min-height: 140px; object-fit: cover; border-radius: var(--border-radius-sm); border: 2px solid var(--color-brass-light); box-shadow: 0 4px 15px rgba(0,0,0,0.6);">
        </div>

      </div>
    `;

    if (animate && barbieri.length > 1) {
      container.style.opacity = '0';
      setTimeout(() => {
        container.innerHTML = buildHTML();
        container.style.opacity = '1';
      }, 350);
    } else {
      container.style.opacity = '1';
      container.innerHTML = buildHTML();
    }

    if (dotsContainer && barbieri.length > 1) {
      dotsContainer.style.display = 'flex';
      let dotsHtml = '';
      barbieri.forEach((_, i) => {
        const activeStyle = (i === idx) ? 'background: var(--color-brass-light); width: 20px;' : 'background: rgba(197, 160, 89, 0.3); width: 8px;';
        dotsHtml += `<span onclick="FranklinApp.Pubblico.selezionaBarbiereSlide(${i})" style="height: 8px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; display: inline-block; ${activeStyle}"></span>`;
      });
      dotsContainer.innerHTML = dotsHtml;
    } else if (dotsContainer) {
      dotsContainer.style.display = 'none';
    }
  },

  selezionaBarbiereSlide(idx) {
    this.barberCarouselState.currentIndex = idx;
    this.renderBarberSlide(true);
  },

  startBarberCarouselAutoPlay() {
    this.stopBarberCarouselAutoPlay();
    if (this.barberCarouselState.barbieri.length <= 1) return;

    this.barberCarouselState.timer = setInterval(() => {
      if (this.barberCarouselState.barbieri.length > 1) {
        this.barberCarouselState.currentIndex = (this.barberCarouselState.currentIndex + 1) % this.barberCarouselState.barbieri.length;
        this.renderBarberSlide(true);
      }
    }, 4500);
  },

  stopBarberCarouselAutoPlay() {
    if (this.barberCarouselState.timer) {
      clearInterval(this.barberCarouselState.timer);
      this.barberCarouselState.timer = null;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  FranklinApp.Pubblico.inizializza();
});
