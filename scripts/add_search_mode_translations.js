const fs = require('fs');
const path = require('path');

const translations = {
  en: {
    search: {
      noDatesInfo: "No dates selected. Approximate prices will be shown. Select dates for current prices and availability."
    },
    searchPage: {
      staticMode: "Static Search",
      realtimeMode: "Live Pricing",
      staticModeInfo: "Showing approximate prices. Select dates in search form for current prices and availability."
    }
  },
  de: {
    search: {
      noDatesInfo: "Keine Daten ausgewählt. Ungefähre Preise werden angezeigt. Wählen Sie Daten für aktuelle Preise und Verfügbarkeit."
    },
    searchPage: {
      staticMode: "Statische Suche",
      realtimeMode: "Live-Preise",
      staticModeInfo: "Ungefähre Preise werden angezeigt. Wählen Sie Daten im Suchformular für aktuelle Preise und Verfügbarkeit."
    }
  },
  fr: {
    search: {
      noDatesInfo: "Aucune date sélectionnée. Les prix approximatifs seront affichés. Sélectionnez des dates pour les prix actuels et la disponibilité."
    },
    searchPage: {
      staticMode: "Recherche Statique",
      realtimeMode: "Prix en Direct",
      staticModeInfo: "Affichage de prix approximatifs. Sélectionnez des dates dans le formulaire de recherche pour les prix actuels et la disponibilité."
    }
  },
  es: {
    search: {
      noDatesInfo: "No se seleccionaron fechas. Se mostrarán precios aproximados. Seleccione fechas para precios actuales y disponibilidad."
    },
    searchPage: {
      staticMode: "Búsqueda Estática",
      realtimeMode: "Precios en Vivo",
      staticModeInfo: "Mostrando precios aproximados. Seleccione fechas en el formulario de búsqueda para precios actuales y disponibilidad."
    }
  },
  it: {
    search: {
      noDatesInfo: "Nessuna data selezionata. Verranno mostrati prezzi approssimativi. Seleziona le date per i prezzi attuali e la disponibilità."
    },
    searchPage: {
      staticMode: "Ricerca Statica",
      realtimeMode: "Prezzi in Tempo Reale",
      staticModeInfo: "Mostrando prezzi approssimativi. Seleziona le date nel modulo di ricerca per i prezzi attuali e la disponibilità."
    }
  },
  nl: {
    search: {
      noDatesInfo: "Geen datums geselecteerd. Geschatte prijzen worden getoond. Selecteer datums voor actuele prijzen en beschikbaarheid."
    },
    searchPage: {
      staticMode: "Statisch Zoeken",
      realtimeMode: "Live Prijzen",
      staticModeInfo: "Geschatte prijzen worden getoond. Selecteer datums in het zoekformulier voor actuele prijzen en beschikbaarheid."
    }
  },
  ru: {
    search: {
      noDatesInfo: "Даты не выбраны. Будут показаны примерные цены. Выберите даты для текущих цен и наличия мест."
    },
    searchPage: {
      staticMode: "Статический Поиск",
      realtimeMode: "Актуальные Цены",
      staticModeInfo: "Показаны примерные цены. Выберите даты в форме поиска для текущих цен и наличия мест."
    }
  },
  el: {
    search: {
      noDatesInfo: "Δεν επιλέχθηκαν ημερομηνίες. Θα εμφανιστούν κατά προσέγγιση τιμές. Επιλέξτε ημερομηνίες για τρέχουσες τιμές και διαθεσιμότητα."
    },
    searchPage: {
      staticMode: "Στατική Αναζήτηση",
      realtimeMode: "Ζωντανές Τιμές",
      staticModeInfo: "Εμφάνιση κατά προσέγγιση τιμών. Επιλέξτε ημερομηνίες στη φόρμα αναζήτησης για τρέχουσες τιμές και διαθεσιμότητα."
    }
  }
};

Object.keys(translations).forEach(locale => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add to home.search
  if (!data.home.search.noDatesInfo) {
    data.home.search.noDatesInfo = translations[locale].search.noDatesInfo;
  }
  
  // Add to search page
  if (!data.search.staticMode) {
    data.search.staticMode = translations[locale].searchPage.staticMode;
    data.search.realtimeMode = translations[locale].searchPage.realtimeMode;
    data.search.staticModeInfo = translations[locale].searchPage.staticModeInfo;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Added search mode translations to ${locale}.json`);
});

console.log('\n🎉 Search mode translations added successfully!');
