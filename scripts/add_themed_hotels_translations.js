const fs = require('fs');
const path = require('path');

const translations = {
  en: {
    themedHotels: {
      title: "Hotels",
      subtitle: "Carefully selected hotels for your chosen theme",
      viewAll: "View All"
    },
    themes: {
      luxury: "Luxury",
      spa: "Spa & Wellness",
      family: "Family",
      budget: "Budget",
      ecoCertified: "Eco-Friendly",
      skiing: "Skiing"
    }
  },
  de: {
    themedHotels: {
      title: "Hotels",
      subtitle: "Sorgfältig ausgewählte Hotels für Ihr gewähltes Thema",
      viewAll: "Alle Anzeigen"
    },
    themes: {
      luxury: "Luxus",
      spa: "Spa & Wellness",
      family: "Familie",
      budget: "Budget",
      ecoCertified: "Umweltfreundlich",
      skiing: "Skifahren"
    }
  },
  fr: {
    themedHotels: {
      title: "Hôtels",
      subtitle: "Hôtels soigneusement sélectionnés pour votre thème choisi",
      viewAll: "Voir Tout"
    },
    themes: {
      luxury: "Luxe",
      spa: "Spa & Bien-être",
      family: "Famille",
      budget: "Budget",
      ecoCertified: "Éco-responsable",
      skiing: "Ski"
    }
  },
  es: {
    themedHotels: {
      title: "Hoteles",
      subtitle: "Hoteles cuidadosamente seleccionados para su tema elegido",
      viewAll: "Ver Todo"
    },
    themes: {
      luxury: "Lujo",
      spa: "Spa & Bienestar",
      family: "Familia",
      budget: "Económico",
      ecoCertified: "Eco-amigable",
      skiing: "Esquí"
    }
  },
  it: {
    themedHotels: {
      title: "Hotel",
      subtitle: "Hotel accuratamente selezionati per il tuo tema scelto",
      viewAll: "Visualizza Tutto"
    },
    themes: {
      luxury: "Lusso",
      spa: "Spa & Benessere",
      family: "Famiglia",
      budget: "Economico",
      ecoCertified: "Eco-sostenibile",
      skiing: "Sci"
    }
  },
  nl: {
    themedHotels: {
      title: "Hotels",
      subtitle: "Zorgvuldig geselecteerde hotels voor uw gekozen thema",
      viewAll: "Bekijk Alles"
    },
    themes: {
      luxury: "Luxe",
      spa: "Spa & Wellness",
      family: "Gezin",
      budget: "Budget",
      ecoCertified: "Milieuvriendelijk",
      skiing: "Skiën"
    }
  },
  ru: {
    themedHotels: {
      title: "Отели",
      subtitle: "Тщательно отобранные отели для выбранной темы",
      viewAll: "Посмотреть Все"
    },
    themes: {
      luxury: "Люкс",
      spa: "Спа и Велнес",
      family: "Семейные",
      budget: "Бюджетные",
      ecoCertified: "Экологичные",
      skiing: "Горнолыжные"
    }
  },
  el: {
    themedHotels: {
      title: "Ξενοδοχεία",
      subtitle: "Προσεκτικά επιλεγμένα ξενοδοχεία για το επιλεγμένο θέμα σας",
      viewAll: "Προβολή Όλων"
    },
    themes: {
      luxury: "Πολυτελή",
      spa: "Σπα & Ευεξία",
      family: "Οικογενειακά",
      budget: "Οικονομικά",
      ecoCertified: "Φιλικά προς το Περιβάλλον",
      skiing: "Σκι"
    }
  }
};

Object.keys(translations).forEach(locale => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.home.themedHotels) {
    data.home.themedHotels = translations[locale].themedHotels;
    data.home.themes = translations[locale].themes;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Added themed hotels translations to ${locale}.json`);
  } else {
    console.log(`⏭️  ${locale}.json already has themed hotels translations`);
  }
});

console.log('\n🎉 Themed hotels translations added successfully!');
