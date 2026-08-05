window.FranklinApp = window.FranklinApp || {};

const oggi = new Date();
const formattaDataISO = (giorniOffset) => {
  const d = new Date(oggi);
  d.setDate(d.getDate() + giorniOffset);
  return d.toISOString().split('T')[0];
};

window.FranklinApp.DatiIniziali = {
  servizi: [
    { id: 'srv_1', nome: 'Taglio Classico', categoria: 'Capelli', durata: 30, prezzo: 20, descrizione: 'Taglio tradizionale con forbici e macchina', immagine: 'assets/images/taglio-capelli.jpg', attivo: true },
    { id: 'srv_2', nome: 'Taglio & Barba Combo', categoria: 'Combo', durata: 50, prezzo: 35, descrizione: 'Taglio capelli completo con rifinitura barba', immagine: 'assets/images/trattamento-panno-caldo.jpg', attivo: true },
    { id: 'srv_3', nome: 'Barba & Baffi', categoria: 'Barba', durata: 25, prezzo: 15, descrizione: 'Rifinitura barba e baffi con rasoio a mano', immagine: 'assets/images/taglio-barba.jpg', attivo: true },
    { id: 'srv_4', nome: 'Rasatura Tradizionale', categoria: 'Barba', durata: 35, prezzo: 25, descrizione: 'Rasatura con asciugamano caldo e rasoio a mano libera', immagine: 'assets/images/taglio-barba.jpg', attivo: true },
    { id: 'srv_5', nome: 'Trattamento Panno Caldo', categoria: 'Trattamenti', durata: 40, prezzo: 30, descrizione: 'Trattamento relax per il viso con asciugamano caldo a vapore', immagine: 'assets/images/trattamento-panno-caldo.jpg', attivo: true },
    { id: 'srv_6', nome: 'Taglio Junior (Under 12)', categoria: 'Capelli', durata: 20, prezzo: 12, descrizione: 'Taglio per i più piccoli', immagine: 'assets/images/taglio-capelli.jpg', attivo: true }
  ],
  barbieri: [
    { id: 'bar_1', nome: 'Marco "Il Maestro"', cognome: 'Rossi', eta: 42, ruolo: 'Barbiere Senior', foto: 'assets/images/barbiere-marco.jpg', descrizione: 'Oltre 20 anni di esperienza nella rasatura classica e taglio sfumato tradizionale.', attivo: true },
    { id: 'bar_2', nome: 'Luca "Mani d\'Oro"', cognome: 'Bianchi', eta: 35, ruolo: 'Specialista Barba', foto: 'assets/images/barbiere-luca.jpg', descrizione: 'Maestro nella modellatura della barba e nei trattamenti con panno caldo.', attivo: true },
    { id: 'bar_3', nome: 'Alessandro', cognome: 'Verdi', eta: 26, ruolo: 'Barbiere Junior', foto: 'assets/images/barbiere-alessandro.jpg', descrizione: 'Specializzato in tagli moderni, styling dinamico e sfumature di precisione.', attivo: true }
  ],
  appuntamenti: [],

  impostazioni: {
    nomeNegozio: "Franklin Barber Shop",
    indirizzo: "Via Roma 42, 20121 Milano",
    telefono: "+39 02 1234567",
    email: "info@franklinbarbershop.it",
    orariLavoro: {
      lunedi: { chiuso: true, mattinaApertura: "", mattinaChiusura: "", pomeriggioApertura: "", pomeriggioChiusura: "" },
      martedi: { chiuso: false, mattinaApertura: "09:00", mattinaChiusura: "13:00", pomeriggioApertura: "14:00", pomeriggioChiusura: "18:00" },
      mercoledi: { chiuso: false, mattinaApertura: "09:00", mattinaChiusura: "13:00", pomeriggioApertura: "14:00", pomeriggioChiusura: "18:00" },
      giovedi: { chiuso: false, mattinaApertura: "09:00", mattinaChiusura: "13:00", pomeriggioApertura: "14:00", pomeriggioChiusura: "18:00" },
      venerdi: { chiuso: false, mattinaApertura: "09:00", mattinaChiusura: "13:00", pomeriggioApertura: "14:00", pomeriggioChiusura: "18:00" },
      sabato: { chiuso: false, mattinaApertura: "09:00", mattinaChiusura: "13:00", pomeriggioApertura: "14:00", pomeriggioChiusura: "18:00" },
      domenica: { chiuso: true, mattinaApertura: "", mattinaChiusura: "", pomeriggioApertura: "", pomeriggioChiusura: "" }
    },
    giorniEccezionali: [
      { id: 'exc_1', data: "2026-12-25", interaGiornata: true, dalle: "", alle: "", motivo: "Natale" }
    ],
    intervalloSlot: 15,
    social: {
      instagram: "https://instagram.com/franklinbarbershop",
      facebook: "https://facebook.com/franklinbarbershop"
    }
  },
  auth: {
    ruoli: [
      {
        id: 'ruolo_admin',
        nome: 'Amministratore',
        permessi: ['appointments', 'services', 'schedule', 'barbers', 'settings', 'users', 'vetrina', 'personale']
      },
      {
        id: 'ruolo_staff',
        nome: 'Staff',
        permessi: ['appointments', 'services', 'schedule', 'barbers', 'vetrina']
      }
    ],
    utenti: [
      {
        id: 'usr_admin',
        nome: 'Super',
        cognome: 'Admin',
        username: 'admin',
        password: 'franklin2026',
        ruoloId: 'ruolo_admin'
      }
    ]
  }
};

