/**
 * Composants lazy-loadés pour optimiser les performances
 * Utilise React.lazy() avec dynamic imports
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Fallback de chargement simple
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Fallback pour les modals
const ModalLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/**
 * MaterialDetailModal - Modal complexe avec 4 onglets
 * Lazy-loadé car visible seulement au clic sur un matériau
 */
export const LazyMaterialDetailModal = dynamic(
  () => import('@/components/materials/MaterialDetailModal').then(mod => ({ default: mod.MaterialDetailModal })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * ShareProjectDialog - Dialog de partage de projet
 * Lazy-loadé car utilisé occasionnellement
 */
export const LazyShareProjectDialog = dynamic(
  () => import('@/components/collaboration/ShareProjectDialog').then(mod => ({ default: mod.ShareProjectDialog })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * MaterialComments - Système de commentaires
 * Lazy-loadé car visible seulement dans l'onglet commentaires
 */
export const LazyMaterialComments = dynamic(
  () => import('@/components/collaboration/MaterialComments').then(mod => ({ default: mod.MaterialComments })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * ProjectHistory - Historique du projet
 * Lazy-loadé car visible seulement au clic sur historique
 */
export const LazyProjectHistory = dynamic(
  () => import('@/components/collaboration/ProjectHistory').then(mod => ({ default: mod.ProjectHistory })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * AISuggestions - Suggestions IA
 * Lazy-loadé car fonctionnalité secondaire
 */
export const LazyAISuggestions = dynamic(
  () => import('@/components/project/AISuggestions').then(mod => ({ default: mod.AISuggestions })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * PriceModal - Modal de gestion des prix
 * Lazy-loadé car visible seulement à l'ajout/édition de prix
 */
export const LazyPriceModal = dynamic(
  () => import('@/components/supplier/PriceModal').then(mod => ({ default: mod.PriceModal })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * EditMaterialModal - Modal d'édition de matériau
 * Lazy-loadé car visible seulement à l'édition
 */
export const LazyEditMaterialModal = dynamic(
  () => import('@/components/supplier/EditMaterialModal').then(mod => ({ default: mod.EditMaterialModal })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * MaterialDrawer - Drawer de détail matériau
 * Lazy-loadé car composant coulissant conditionnel
 */
export const LazyMaterialDrawer = dynamic(
  () => import('@/components/materials/MaterialDrawer').then(mod => ({ default: mod.MaterialDrawer })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * DynamicMissionForm - Formulaire de mission dynamique généré par IA
 * Lazy-loadé car chargé à la demande
 */
export const LazyDynamicMissionForm = dynamic(
  () => import('@/components/missions/DynamicMissionForm').then(mod => ({ default: mod.DynamicMissionForm })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * SendToSuppliersDialog - Dialog d'envoi aux fournisseurs
 * Lazy-loadé car utilisé occasionnellement
 */
export const LazySendToSuppliersDialog = dynamic(
  () => import('@/components/project/SendToSuppliersDialog').then(mod => ({ default: mod.SendToSuppliersDialog })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Helper pour charger jsPDF à la demande
 * Évite de charger cette grosse librairie au chargement initial
 */
export async function loadPDFLibraries() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
}
