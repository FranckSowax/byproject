# 📍 Géolocalisation des Fournisseurs

## 🎯 Objectif

Permettre aux utilisateurs qui se rendent en Chine de localiser facilement les fournisseurs sur place avec:
- ✅ Coordonnées GPS (latitude/longitude)
- ✅ Adresse complète (ville, province)
- ✅ Nom du lieu (marché, zone industrielle)
- ✅ Instructions de navigation
- ✅ Liens Google Maps et Baidu Maps

---

## 📊 Structure de Données

### Table `suppliers` - Colonnes Ajoutées

```sql
-- Coordonnées GPS
latitude NUMERIC(10, 8)          -- Ex: 23.1291 (Guangzhou)
longitude NUMERIC(11, 8)         -- Ex: 113.2644 (Guangzhou)

-- Localisation
location_name TEXT               -- Ex: "Marché de Yiwu", "Zone industrielle de Foshan"
city TEXT                        -- Ex: "Guangzhou", "Shenzhen", "Yiwu"
province TEXT                    -- Ex: "Guangdong", "Zhejiang", "Fujian"
postal_code TEXT                 -- Ex: "510000"

-- Navigation
directions TEXT                  -- Instructions pour se rendre au fournisseur
google_maps_url TEXT            -- Lien Google Maps
baidu_maps_url TEXT             -- Lien Baidu Maps (utilisé en Chine)
```

---

## 🗺️ Principales Villes Chinoises

### Guangdong (Canton)
```
Guangzhou (Canton)
├─ Latitude: 23.1291
├─ Longitude: 113.2644
└─ Spécialités: Construction, Électronique

Shenzhen
├─ Latitude: 22.5431
├─ Longitude: 114.0579
└─ Spécialités: Électronique, High-tech

Foshan
├─ Latitude: 23.0218
├─ Longitude: 113.1219
└─ Spécialités: Céramique, Meubles, Construction
```

### Zhejiang
```
Yiwu
├─ Latitude: 29.3064
├─ Longitude: 120.0753
└─ Spécialités: Marché de gros, Petits articles

Hangzhou
├─ Latitude: 30.2741
├─ Longitude: 120.1551
└─ Spécialités: E-commerce, Textile
```

### Fujian
```
Xiamen
├─ Latitude: 24.4798
├─ Longitude: 118.0894
└─ Spécialités: Import/Export, Construction

Quanzhou
├─ Latitude: 24.8741
├─ Longitude: 118.6758
└─ Spécialités: Pierre, Céramique
```

---

## 🎨 Interface Utilisateur

### 1. Formulaire Fournisseur avec Géolocalisation

```
┌──────────────────────────────────────────────────────────┐
│ Ajouter un Fournisseur - Chine                       [X] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ─────────────── Informations de Base ───────────────    │
│                                                          │
│ Nom du fournisseur *                                    │
│ [Guangzhou Building Materials Co.                   ]   │
│                                                          │
│ Pays                                                    │
│ [Chine ▼]                                               │
│                                                          │
│ ─────────────── Localisation ───────────────            │
│                                                          │
│ Ville *                                                 │
│ [Guangzhou ▼]  (Guangzhou, Shenzhen, Yiwu, etc.)      │
│                                                          │
│ Province                                                │
│ [Guangdong ▼]  (Guangdong, Zhejiang, Fujian, etc.)    │
│                                                          │
│ Nom du lieu                                             │
│ [Marché de Tianhe - Bâtiment A, 3ème étage        ]   │
│                                                          │
│ Adresse complète                                        │
│ [123 Tianhe Road, Tianhe District                 ]   │
│                                                          │
│ Code postal                                             │
│ [510000                                            ]   │
│                                                          │
│ ─────────────── Coordonnées GPS ───────────────         │
│                                                          │
│ Latitude                  Longitude                     │
│ [23.1291      ]          [113.2644      ]              │
│                                                          │
│ [📍 Obtenir ma position]  [🗺️ Choisir sur la carte]   │
│                                                          │
│ ─────────────── Navigation ───────────────              │
│                                                          │
│ Instructions pour s'y rendre                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Depuis la station de métro Tianhe:                │  │
│ │ - Sortie B                                         │  │
│ │ - Marcher 500m vers l'est                         │  │
│ │ - Bâtiment rouge à gauche                         │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Lien Google Maps                                        │
│ [https://maps.google.com/?q=23.1291,113.2644      ]   │
│ [🔗 Générer automatiquement]                            │
│                                                          │
│ Lien Baidu Maps (百度地图)                              │
│ [https://map.baidu.com/?q=23.1291,113.2644        ]   │
│ [🔗 Générer automatiquement]                            │
│                                                          │
│                              [Annuler] [Enregistrer]    │
└──────────────────────────────────────────────────────────┘
```

### 2. Affichage Fournisseur avec Carte

```
┌──────────────────────────────────────────────────────────┐
│ 📍 Guangzhou Building Materials Co.                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │                                                    │  │
│ │              [CARTE INTERACTIVE]                   │  │
│ │                                                    │  │
│ │                    📍                              │  │
│ │                Guangzhou                           │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 📍 Localisation                                         │
│ ├─ Ville: Guangzhou                                     │
│ ├─ Province: Guangdong                                  │
│ ├─ Lieu: Marché de Tianhe - Bâtiment A, 3ème étage    │
│ └─ Adresse: 123 Tianhe Road, Tianhe District          │
│                                                          │
│ 🧭 Coordonnées GPS                                      │
│ ├─ Latitude: 23.1291                                    │
│ └─ Longitude: 113.2644                                  │
│                                                          │
│ 🗺️ Navigation                                           │
│ ├─ [Ouvrir dans Google Maps]                           │
│ ├─ [Ouvrir dans Baidu Maps]                            │
│ └─ [Copier les coordonnées]                            │
│                                                          │
│ 📝 Instructions                                         │
│ Depuis la station de métro Tianhe:                     │
│ - Sortie B                                              │
│ - Marcher 500m vers l'est                              │
│ - Bâtiment rouge à gauche                              │
│                                                          │
│ 📞 Contact                                              │
│ ├─ WeChat: supplier123                                  │
│ ├─ Téléphone: +86 20 XXXX XXXX                         │
│ └─ Email: contact@supplier.com                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3. Carte avec Tous les Fournisseurs

```
┌──────────────────────────────────────────────────────────┐
│ 🗺️ Carte des Fournisseurs en Chine                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Filtres: [Guangdong ▼] [Construction ▼] [Tous]         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │                                                    │  │
│ │              [CARTE INTERACTIVE]                   │  │
│ │                                                    │  │
│ │    📍 Guangzhou (3 fournisseurs)                  │  │
│ │    📍 Shenzhen (2 fournisseurs)                   │  │
│ │    📍 Foshan (1 fournisseur)                      │  │
│ │    📍 Yiwu (5 fournisseurs)                       │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 📋 Liste des fournisseurs                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📍 Guangzhou Building Materials Co.                │  │
│ │    Guangzhou, Guangdong                            │  │
│ │    Distance: 2.5 km de votre position             │  │
│ │    [Voir détails] [Itinéraire]                    │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 📍 Foshan Ceramics Supplier                        │  │
│ │    Foshan, Guangdong                               │  │
│ │    Distance: 15 km de votre position              │  │
│ │    [Voir détails] [Itinéraire]                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Fonctionnalités

### Obtenir la Position
```javascript
// Obtenir la position GPS actuelle de l'utilisateur
navigator.geolocation.getCurrentPosition((position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  // Remplir automatiquement les champs
});
```

### Générer les Liens Maps
```javascript
// Google Maps
const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

// Baidu Maps (utilisé en Chine)
const baiduMapsUrl = `https://map.baidu.com/?q=${latitude},${longitude}`;
```

### Calculer la Distance
```javascript
// Formule de Haversine pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
}
```

---

## 📱 Intégration Mobile

### Ouvrir dans l'App Native
```javascript
// iOS
const iosUrl = `maps://maps.google.com/?q=${latitude},${longitude}`;

// Android
const androidUrl = `geo:${latitude},${longitude}`;

// Détection et ouverture
if (iOS) {
  window.location.href = iosUrl;
} else if (Android) {
  window.location.href = androidUrl;
}
```

---

## 🗺️ Exemples de Fournisseurs

### Exemple 1: Marché de Yiwu
```json
{
  "name": "Yiwu International Trade Market",
  "country": "Chine",
  "city": "Yiwu",
  "province": "Zhejiang",
  "location_name": "District 1, Bâtiment A",
  "address": "Chouzhou North Road, Yiwu",
  "latitude": 29.3064,
  "longitude": 120.0753,
  "directions": "Depuis la gare de Yiwu: Taxi 15 min, Bus ligne 801",
  "google_maps_url": "https://maps.google.com/?q=29.3064,120.0753",
  "baidu_maps_url": "https://map.baidu.com/?q=29.3064,120.0753"
}
```

### Exemple 2: Zone Industrielle de Foshan
```json
{
  "name": "Foshan Ceramics Industrial Zone",
  "country": "Chine",
  "city": "Foshan",
  "province": "Guangdong",
  "location_name": "Zone industrielle de Nanzhuang",
  "address": "Nanzhuang Avenue, Chancheng District",
  "latitude": 23.0218,
  "longitude": 113.1219,
  "directions": "Métro ligne 2, station Nanzhuang, sortie C",
  "google_maps_url": "https://maps.google.com/?q=23.0218,113.1219",
  "baidu_maps_url": "https://map.baidu.com/?q=23.0218,113.1219"
}
```

---

## 🚀 Cas d'Usage

### 1. Utilisateur en Déplacement en Chine
```
1. Ouvre l'app sur son téléphone
2. Va sur "Carte des fournisseurs"
3. Active la géolocalisation
4. Voit les fournisseurs à proximité
5. Sélectionne un fournisseur
6. Clique "Itinéraire"
7. Navigation GPS vers le fournisseur
```

### 2. Planification de Voyage
```
1. Avant le voyage, consulte la carte
2. Identifie les fournisseurs par ville
3. Planifie l'itinéraire optimal
4. Note les instructions de navigation
5. Sauvegarde les contacts WeChat
```

### 3. Recherche par Proximité
```
1. Filtre: "Fournisseurs à moins de 10 km"
2. Tri par distance
3. Compare les prix locaux
4. Visite plusieurs fournisseurs le même jour
```

---

## 📊 Requêtes SQL Utiles

### Trouver les Fournisseurs Proches
```sql
-- Fonction pour calculer la distance (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC, lon1 NUMERIC,
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  R NUMERIC := 6371; -- Rayon de la Terre en km
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Trouver les fournisseurs dans un rayon de 10 km
SELECT 
  name,
  city,
  calculate_distance(23.1291, 113.2644, latitude, longitude) as distance_km
FROM suppliers
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND calculate_distance(23.1291, 113.2644, latitude, longitude) <= 10
ORDER BY distance_km;
```

### Fournisseurs par Ville
```sql
SELECT 
  city,
  COUNT(*) as nb_fournisseurs,
  STRING_AGG(name, ', ') as fournisseurs
FROM suppliers
WHERE country = 'Chine'
GROUP BY city
ORDER BY nb_fournisseurs DESC;
```

---

## ✅ Checklist Implémentation

- [x] Colonnes géolocalisation ajoutées
- [x] Index créés pour performances
- [ ] Interface formulaire avec carte
- [ ] Bouton "Obtenir ma position"
- [ ] Génération automatique liens Maps
- [ ] Carte interactive avec marqueurs
- [ ] Calcul de distance
- [ ] Filtres par ville/province
- [ ] Tri par proximité
- [ ] Intégration mobile

---

## 🎉 Résumé

**Géolocalisation des fournisseurs activée!**

- ✅ Coordonnées GPS (latitude/longitude)
- ✅ Adresse complète (ville, province, lieu)
- ✅ Instructions de navigation
- ✅ Liens Google Maps et Baidu Maps
- ✅ Index pour recherches géographiques

**Parfait pour les utilisateurs qui se rendent en Chine!** 🇨🇳

---

**Prochaine étape**: Créer l'interface carte interactive!
