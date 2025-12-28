const fs = require('fs');
const path = require('path');

const translations = {
  de: {
    title: "Beliebte Länder",
    subtitle: "Entdecken Sie die beliebtesten Urlaubsländer und Reiseziele"
  },
  fr: {
    title: "Pays Populaires",
    subtitle: "Découvrez les pays et destinations de vacances les plus populaires"
  },
  es: {
    title: "Países Populares",
    subtitle: "Descubra los países y destinos vacacionales más populares"
  },
  it: {
    title: "Paesi Popolari",
    subtitle: "Scopri i paesi e le destinazioni vacanza più popolari"
  },
  nl: {
    title: "Populaire Landen",
    subtitle: "Ontdek de meest populaire vakantielanden en bestemmingen"
  },
  ru: {
    title: "Популярные Страны",
    subtitle: "Откройте для себя самые популярные страны и направления для отдыха"
  },
  el: {
    title: "Δημοφιλείς Χώρες",
    subtitle: "Ανακαλύψτε τις πιο δημοφιλείς χώρες και προορισμούς διακοπών"
  }
};

Object.keys(translations).forEach(locale => {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.home.countries) {
    data.home.countries = translations[locale];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Added countries translation to ${locale}.json`);
  } else {
    console.log(`⏭️  ${locale}.json already has countries translation`);
  }
});

console.log('\n🎉 Countries translations added successfully!');
