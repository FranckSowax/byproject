# Exemples d'Implémentation Mobile React Native

## 📱 Écrans Complets avec Code

### 1. Liste des Projets

```typescript
// src/screens/projects/ProjectsListScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { useProjects } from '@/hooks/useProjects';

export function ProjectsListScreen({ navigation }) {
  const { projects, isLoading } = useProjects();

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProjectDetail', { id: item.id })}
    >
      {item.main_image_url && (
        <Image source={{ uri: item.main_image_url }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{item.materials?.length || 0} matériaux</Text>
          <Text style={styles.stat}>{item.budget || 0}€</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Projets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateProject')}
        >
          <Text style={styles.addButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  list: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  image: { width: '100%', height: 180 },
  content: { padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  location: { color: '#666', marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 15 },
  stat: { color: '#007AFF', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
```

### 2. Détail du Projet

```typescript
// src/screens/projects/ProjectDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function ProjectDetailScreen({ route, navigation }) {
  const { id } = route.params;
  
  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          materials (
            id,
            name,
            quantity,
            unit,
            category,
            prices (
              id,
              amount,
              currency,
              supplier_name
            )
          )
        `)
        .eq('id', id)
        .single();
      return data;
    }
  });

  if (!project) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Header avec image */}
      {project.main_image_url && (
        <Image source={{ uri: project.main_image_url }} style={styles.hero} />
      )}
      
      {/* Infos projet */}
      <View style={styles.section}>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{project.location}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{project.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Statut</Text>
            <Text style={styles.infoValue}>{project.status}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Budget</Text>
            <Text style={styles.infoValue}>{project.budget}€</Text>
          </View>
        </View>
      </View>

      {/* Matériaux */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matériaux ({project.materials?.length})</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddMaterial', { projectId: id })}
          >
            <Text style={styles.addLink}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
        
        {project.materials?.map(material => (
          <View key={material.id} style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <Text style={styles.materialName}>{material.name}</Text>
              {material.category && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{material.category}</Text>
                </View>
              )}
            </View>
            <Text style={styles.materialQty}>
              {material.quantity} {material.unit}
            </Text>
            
            {/* Prix */}
            {material.prices?.length > 0 && (
              <View style={styles.prices}>
                {material.prices.map(price => (
                  <View key={price.id} style={styles.priceRow}>
                    <Text style={styles.supplier}>{price.supplier_name}</Text>
                    <Text style={styles.amount}>
                      {price.amount} {price.currency}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Modifier le projet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Comparer les prix</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  hero: { width: '100%', height: 250 },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 5 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addLink: { color: '#007AFF', fontSize: 16 },
  materialCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  materialName: { fontSize: 16, fontWeight: '600' },
  materialQty: { color: '#666', marginBottom: 10 },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  badgeText: { color: '#1976d2', fontSize: 12 },
  prices: { borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 10 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  supplier: { color: '#666' },
  amount: { fontWeight: '600' },
  actions: { padding: 20, gap: 10 },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' }
});
```

### 3. Ajouter un Matériau avec Upload Photo

```typescript
// src/screens/materials/AddMaterialScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export function AddMaterialScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets]);
    }
  };

  const uploadImages = async (materialId) => {
    const uploadPromises = photos.map(async (photo, index) => {
      const ext = photo.uri.split('.').pop();
      const fileName = `${materialId}/${Date.now()}_${index}.${ext}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: `image/${ext}`,
        name: fileName,
      } as any);

      const { data, error } = await supabase.storage
        .from('project-materials')
        .upload(fileName, formData);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('project-materials')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return await Promise.all(uploadPromises);
  };

  const handleSave = async () => {
    if (!name || !quantity) {
      Alert.alert('Erreur', 'Nom et quantité requis');
      return;
    }

    setLoading(true);

    try {
      // Créer matériau
      const { data: material, error } = await supabase
        .from('materials')
        .insert({
          project_id: projectId,
          name,
          quantity: parseFloat(quantity),
          unit,
          category
        })
        .select()
        .single();

      if (error) throw error;

      // Upload photos si présentes
      if (photos.length > 0) {
        const imageUrls = await uploadImages(material.id);
        
        await supabase
          .from('materials')
          .update({ images: imageUrls })
          .eq('id', material.id);
      }

      Alert.alert('Succès', 'Matériau ajouté');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nom du matériau *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Ciment Portland"
        />

        <Text style={styles.label}>Quantité *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="100"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            value={unit}
            onChangeText={setUnit}
            placeholder="kg"
          />
        </View>

        <Text style={styles.label}>Catégorie</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Ex: Maçonnerie"
        />

        <Text style={styles.label}>Photos</Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>📷 Ajouter des photos</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                style={styles.thumbnail}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16
  },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  unitInput: { width: 100 },
  photoButton: {
    backgroundColor: '#f0f0f0',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed'
  },
  photoButtonText: { fontSize: 16 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  disabled: { opacity: 0.5 }
});
```

### 4. Page Abonnement avec Stripe

```typescript
// src/screens/profile/SubscriptionScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function SubscriptionScreen() {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    }
  });

  const handleUpgrade = async (plan) => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId })
      });
      
      const { url } = await response.json();
      await Linking.openURL(url);
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Plan actuel */}
      <View style={styles.currentPlan}>
        <Text style={styles.currentPlanLabel}>Plan actuel</Text>
        <Text style={styles.currentPlanName}>
          {subscription?.plan?.toUpperCase() || 'GRATUIT'}
        </Text>
        {subscription?.status === 'active' && (
          <Text style={styles.renewDate}>
            Renouvellement: {new Date(subscription.current_period_end).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Plans disponibles */}
      <View style={styles.planCard}>
        <Text style={styles.planName}>Pro</Text>
        <Text style={styles.planPrice}>29,99€/mois</Text>
        <Text style={styles.planFeature}>✓ Projets illimités</Text>
        <Text style={styles.planFeature}>✓ Templates premium</Text>
        <Text style={styles.planFeature}>✓ Support prioritaire</Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => handleUpgrade({ priceId: 'price_pro_monthly' })}
        >
          <Text style={styles.upgradeButtonText}>Souscrire</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planCard}>
        <Text style={styles.planName}>Enterprise</Text>
        <Text style={styles.planPrice}>99,99€/mois</Text>
        <Text style={styles.planFeature}>✓ Multi-utilisateurs</Text>
        <Text style={styles.planFeature}>✓ API access</Text>
        <Text style={styles.planFeature}>✓ Support dédié</Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => handleUpgrade({ priceId: 'price_enterprise_monthly' })}
        >
          <Text style={styles.upgradeButtonText}>Souscrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  currentPlan: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center'
  },
  currentPlanLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
  currentPlanName: { fontSize: 24, fontWeight: 'bold' },
  renewDate: { fontSize: 12, color: '#999', marginTop: 10 },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15
  },
  planName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  planPrice: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 20 },
  planFeature: { fontSize: 14, color: '#666', marginBottom: 8 },
  upgradeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
```

---

## 🔄 Synchronisation Offline

```typescript
// src/hooks/useOfflineSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useOfflineSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Écouter changements de connexion
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Réhydrater données depuis cache
        syncOfflineData();
      } else {
        // Sauvegarder données localement
        cacheData();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncOfflineData = async () => {
    // Récupérer actions en attente
    const pending = await AsyncStorage.getItem('pending_actions');
    if (pending) {
      const actions = JSON.parse(pending);
      // Exécuter actions en attente
      for (const action of actions) {
        await executeAction(action);
      }
      await AsyncStorage.removeItem('pending_actions');
    }
    // Rafraîchir données
    queryClient.invalidateQueries();
  };

  const cacheData = async () => {
    const cache = queryClient.getQueryCache().getAll();
    await AsyncStorage.setItem('query_cache', JSON.stringify(cache));
  };
}
```

---

**Version**: 1.0.0  
**Date**: 2025-11-20  
**Voir aussi**: `APP_ARCHITECTURE_GUIDE.md`
