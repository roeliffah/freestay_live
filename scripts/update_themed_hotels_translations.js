const fs = require('fs');
const path = require('path');

const translations = {
  en: {
    title: "Hotels by Theme",
    subtitle: "Choose a theme category that interests you and discover hotels tailored to your preferences"
  },
  de: {
    title: "Hotels nach Thema",
    subtitle: "Wählen Sie eine Themenkategorie, die Sie interessiert, und entdecken Sie passende Hotels"
  },
  fr: {
    title: "Hôtels par Thème",
    subtitle: "Choisissez une catégorie thématique qui vous intéresse et découvrez des hôtels adaptés"
  },
  es: {
    title: "Hoteles por Tema",
    subtitle: "Elija una categoría temática que le interese y descubra hoteles adaptados"
  },
  it: {
    title: "Hotel per Tema",
    subtitle: "Scegli una categoria tematica che ti interessa e scopri hotel su misura"
  },
  nl: {
    title: "Hotels per Thema",
    subtitle: "Kies een themacategorie die u interesseert en ontdek geschikte hotels"
  },
  ru: {
    title: "Отели по Темам",
    subtitle: "Выберите интересующую вас тематическую категорию и откройте для себя подходящие отели"
  },
  el: {
    title: "Ξενοδοχεία ανά Θέμα",
    subtitle: "Επιλέξτε μια θεματική κατηγορία που σας ενδιαφέρει και ανακαλύψτε κατάλληλα ξενοδοχεία"
  }
};

Object.keys(translations).forEach(locale => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.home.themedHotels) {
    data.home.themedHotels.title = translations[locale].title;
    data.home.themedHotels.subtitle = translations[locale].subtitle;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Updated themed hotels title/subtitle in ${locale}.json`);
  }
});

console.log('\n🎉 Themed hotels translations updated successfully!');
