// Liste complète des pays pour la gestion des prix

export const COUNTRIES = [
  // Pays africains (ordre alphabétique)
  { value: 'Afrique du Sud', label: 'Afrique du Sud', flag: '🇿🇦' },
  { value: 'Algérie', label: 'Algérie', flag: '🇩🇿' },
  { value: 'Angola', label: 'Angola', flag: '🇦🇴' },
  { value: 'Bénin', label: 'Bénin', flag: '🇧🇯' },
  { value: 'Botswana', label: 'Botswana', flag: '🇧🇼' },
  { value: 'Burkina Faso', label: 'Burkina Faso', flag: '🇧🇫' },
  { value: 'Burundi', label: 'Burundi', flag: '🇧🇮' },
  { value: 'Cameroun', label: 'Cameroun', flag: '🇨🇲' },
  { value: 'Cap-Vert', label: 'Cap-Vert', flag: '🇨🇻' },
  { value: 'Centrafrique', label: 'Centrafrique', flag: '🇨🇫' },
  { value: 'Comores', label: 'Comores', flag: '🇰🇲' },
  { value: 'Congo', label: 'Congo', flag: '🇨🇬' },
  { value: 'Congo (RDC)', label: 'Congo (RDC)', flag: '🇨🇩' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { value: 'Djibouti', label: 'Djibouti', flag: '🇩🇯' },
  { value: 'Égypte', label: 'Égypte', flag: '🇪🇬' },
  { value: 'Érythrée', label: 'Érythrée', flag: '🇪🇷' },
  { value: 'Eswatini', label: 'Eswatini', flag: '🇸🇿' },
  { value: 'Éthiopie', label: 'Éthiopie', flag: '🇪🇹' },
  { value: 'Gabon', label: 'Gabon', flag: '🇬🇦' },
  { value: 'Gambie', label: 'Gambie', flag: '🇬🇲' },
  { value: 'Ghana', label: 'Ghana', flag: '🇬🇭' },
  { value: 'Guinée', label: 'Guinée', flag: '🇬🇳' },
  { value: 'Guinée-Bissau', label: 'Guinée-Bissau', flag: '🇬🇼' },
  { value: 'Guinée équatoriale', label: 'Guinée équatoriale', flag: '🇬🇶' },
  { value: 'Kenya', label: 'Kenya', flag: '🇰🇪' },
  { value: 'Lesotho', label: 'Lesotho', flag: '🇱🇸' },
  { value: 'Liberia', label: 'Liberia', flag: '🇱🇷' },
  { value: 'Libye', label: 'Libye', flag: '🇱🇾' },
  { value: 'Madagascar', label: 'Madagascar', flag: '🇲🇬' },
  { value: 'Malawi', label: 'Malawi', flag: '🇲🇼' },
  { value: 'Mali', label: 'Mali', flag: '🇲🇱' },
  { value: 'Maroc', label: 'Maroc', flag: '🇲🇦' },
  { value: 'Maurice', label: 'Maurice', flag: '🇲🇺' },
  { value: 'Mauritanie', label: 'Mauritanie', flag: '🇲🇷' },
  { value: 'Mozambique', label: 'Mozambique', flag: '🇲🇿' },
  { value: 'Namibie', label: 'Namibie', flag: '🇳🇦' },
  { value: 'Niger', label: 'Niger', flag: '🇳🇪' },
  { value: 'Nigeria', label: 'Nigeria', flag: '🇳🇬' },
  { value: 'Ouganda', label: 'Ouganda', flag: '🇺🇬' },
  { value: 'Rwanda', label: 'Rwanda', flag: '🇷🇼' },
  { value: 'Sao Tomé-et-Principe', label: 'Sao Tomé-et-Principe', flag: '🇸🇹' },
  { value: 'Sénégal', label: 'Sénégal', flag: '🇸🇳' },
  { value: 'Seychelles', label: 'Seychelles', flag: '🇸🇨' },
  { value: 'Sierra Leone', label: 'Sierra Leone', flag: '🇸🇱' },
  { value: 'Somalie', label: 'Somalie', flag: '🇸🇴' },
  { value: 'Soudan', label: 'Soudan', flag: '🇸🇩' },
  { value: 'Soudan du Sud', label: 'Soudan du Sud', flag: '🇸🇸' },
  { value: 'Tanzanie', label: 'Tanzanie', flag: '🇹🇿' },
  { value: 'Tchad', label: 'Tchad', flag: '🇹🇩' },
  { value: 'Togo', label: 'Togo', flag: '🇹🇬' },
  { value: 'Tunisie', label: 'Tunisie', flag: '🇹🇳' },
  { value: 'Zambie', label: 'Zambie', flag: '🇿🇲' },
  { value: 'Zimbabwe', label: 'Zimbabwe', flag: '🇿🇼' },
  
  // Pays hors Afrique
  { value: 'Chine', label: 'Chine', flag: '🇨🇳' },
  { value: 'Dubai', label: 'Dubai (EAU)', flag: '🇦🇪' },
  { value: 'Turquie', label: 'Turquie', flag: '🇹🇷' },
];

// Fonction helper pour obtenir le drapeau d'un pays
export const getCountryFlag = (countryName: string): string => {
  const country = COUNTRIES.find(c => c.value === countryName);
  return country?.flag || '🌍';
};

// Fonction helper pour obtenir le label d'un pays
export const getCountryLabel = (countryName: string): string => {
  const country = COUNTRIES.find(c => c.value === countryName);
  return country?.label || countryName;
};
