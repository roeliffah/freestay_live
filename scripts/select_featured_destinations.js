// Extract popular destinations from Turkey, Spain, Italy, Greece, Dubai
const fs = require('fs');
const path = require('path');

const destinationsData = require('../data/destinations.json');

console.log('🌍 Selecting popular destinations for demo...\n');

// Target countries and their popular cities
const targetDestinations = {
  'Turkey': ['Antalya', 'Istanbul', 'Bodrum', 'Marmaris', 'Alanya', 'Kusadasi', 'Fethiye', 'Side', 'Belek'],
  'Spain': ['Barcelona', 'Madrid', 'Mallorca', 'Ibiza', 'Marbella', 'Valencia', 'Seville', 'Malaga'],
  'Italy': ['Rome', 'Venice', 'Milan', 'Florence', 'Naples', 'Rimini', 'Sorrento'],
  'Greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Zakynthos'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah']
};

const selectedDestinations = [];

Object.entries(targetDestinations).forEach(([country, cities]) => {
  console.log(`🔍 ${country}:`);
  
  cities.forEach(cityName => {
    const found = destinationsData.all.find(d => 
      d.country === country && 
      d.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (found) {
      selectedDestinations.push(found);
      console.log(`  ✅ ${found.name} (ID: ${found.id})`);
    } else {
      console.log(`  ⚠️  ${cityName} - not found`);
    }
  });
  console.log('');
});

// Group by country for cascading selection
const byCountry = {
  turkey: selectedDestinations.filter(d => d.country === 'Turkey'),
  spain: selectedDestinations.filter(d => d.country === 'Spain'),
  italy: selectedDestinations.filter(d => d.country === 'Italy'),
  greece: selectedDestinations.filter(d => d.country === 'Greece'),
  uae: selectedDestinations.filter(d => d.country === 'United Arab Emirates'),
};

console.log('📊 Summary:');
console.log(`  🇹🇷 Turkey: ${byCountry.turkey.length} cities`);
console.log(`  🇪🇸 Spain: ${byCountry.spain.length} cities`);
console.log(`  🇮🇹 Italy: ${byCountry.italy.length} cities`);
console.log(`  🇬🇷 Greece: ${byCountry.greece.length} cities`);
console.log(`  🇦🇪 UAE: ${byCountry.uae.length} cities`);
console.log(`  📍 Total: ${selectedDestinations.length} destinations\n`);

// Save selected destinations
const dataDir = path.join(__dirname, '..', 'data');
const outputPath = path.join(dataDir, 'featured-destinations.json');

const output = {
  countries: [
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', cities: byCountry.turkey },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', cities: byCountry.spain },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', cities: byCountry.italy },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', cities: byCountry.greece },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', cities: byCountry.uae },
  ],
  all: selectedDestinations
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`💾 Saved to: ${outputPath}`);
console.log('\n✨ Done! Featured destinations ready for cascading selection.');
