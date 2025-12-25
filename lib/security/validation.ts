/**
 * Validation côté serveur pour toutes les entrées utilisateur
 * Utilise Zod pour la validation des schémas
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ========================================
// SCHÉMAS DE VALIDATION
// ========================================

/**
 * Validation d'email
 */
export const emailSchema = z.string()
  .email("Email invalide")
  .min(5, "Email trop court")
  .max(255, "Email trop long")
  .toLowerCase()
  .trim();

/**
 * Validation de mot de passe fort
 * - Minimum 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const passwordSchema = z.string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe est trop long")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial");

/**
 * Validation de nom de projet
 */
export const projectNameSchema = z.string()
  .min(1, "Le nom du projet est requis")
  .max(255, "Le nom du projet est trop long")
  .trim();

/**
 * Validation de nom de matériau
 */
export const materialNameSchema = z.string()
  .min(1, "Le nom du matériau est requis")
  .max(255, "Le nom du matériau est trop long")
  .trim();

/**
 * Validation de quantité
 */
export const quantitySchema = z.number()
  .int("La quantité doit être un nombre entier")
  .positive("La quantité doit être positive")
  .max(1000000, "La quantité est trop élevée");

/**
 * Validation de montant
 */
export const amountSchema = z.number()
  .positive("Le montant doit être positif")
  .max(1000000000, "Le montant est trop élevé")
  .finite("Le montant doit être un nombre valide");

/**
 * Validation de devise
 */
export const currencySchema = z.enum(['FCFA', 'CNY', 'USD', 'EUR', 'GBP', 'TRY', 'AED'], {
  message: "Devise non supportée"
});

/**
 * Validation de pays
 */
export const countrySchema = z.string()
  .min(2, "Nom de pays invalide")
  .max(100, "Nom de pays trop long")
  .trim();

/**
 * Validation de nom de fournisseur
 */
export const supplierNameSchema = z.string()
  .min(1, "Le nom du fournisseur est requis")
  .max(255, "Le nom du fournisseur est trop long")
  .trim();

/**
 * Validation de téléphone
 */
export const phoneSchema = z.string()
  .regex(/^\+?[0-9\s\-()]{8,20}$/, "Numéro de téléphone invalide")
  .optional()
  .or(z.literal(''));

/**
 * Validation d'URL
 */
export const urlSchema = z.string()
  .url("URL invalide")
  .max(2048, "URL trop longue")
  .optional()
  .or(z.literal(''));

// ========================================
// SCHÉMAS COMPOSÉS
// ========================================

/**
 * Schéma pour création de projet
 */
export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: z.string().max(1000, "Description trop longue").optional(),
});

/**
 * Schéma pour création de matériau
 */
export const createMaterialSchema = z.object({
  name: materialNameSchema,
  project_id: z.string().uuid("ID de projet invalide"),
  quantity: quantitySchema.optional(),
  category: z.string().max(100).optional(),
  specs: z.record(z.any()).optional(),
});

/**
 * Schéma pour création de prix
 */
export const createPriceSchema = z.object({
  material_id: z.string().uuid("ID de matériau invalide"),
  supplier_id: z.string().uuid("ID de fournisseur invalide").optional(),
  country: countrySchema,
  amount: amountSchema,
  currency: currencySchema,
  notes: z.string().max(1000, "Notes trop longues").optional(),
});

/**
 * Schéma pour création de fournisseur
 */
export const createSupplierSchema = z.object({
  name: supplierNameSchema,
  country: countrySchema,
  contact_name: z.string().max(255).optional(),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: emailSchema.optional(),
  wechat: z.string().max(100).optional(),
});

// ========================================
// FONCTIONS DE SANITIZATION
// ========================================

/**
 * Nettoie une chaîne de caractères pour éviter les injections XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  });
  return typeof cleaned === 'string' ? cleaned.trim() : '';
}

/**
 * Nettoie un objet en sanitizant toutes les valeurs string
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Valide et sanitize un email
 */
export function validateAndSanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email);
  const result = emailSchema.safeParse(sanitized);
  
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  
  return result.data;
}

/**
 * Valide un mot de passe
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map((e: any) => e.message)
  };
}

/**
 * Échappe les caractères SQL dangereux
 * Note: Supabase utilise des requêtes paramétrées, mais c'est une sécurité supplémentaire
 */
export function escapeSql(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/['";\\]/g, '\\$&');
}

/**
 * Valide un UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Limite la longueur d'une chaîne
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

// ========================================
// VALIDATION DE FICHIERS
// ========================================

/**
 * Types MIME autorisés pour les images
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

/**
 * Types MIME autorisés pour les documents
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

/**
 * Taille maximale des fichiers (en bytes)
 */
export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
};

/**
 * Valide un fichier image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.'
    };
  }
  
  if (file.size > MAX_FILE_SIZE.IMAGE) {
    return {
      valid: false,
      error: `L'image est trop volumineuse. Taille maximale: ${MAX_FILE_SIZE.IMAGE / 1024 / 1024}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Valide un fichier document
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé. Utilisez PDF, Excel ou CSV.'
    };
  }
  
  if (file.size > MAX_FILE_SIZE.DOCUMENT) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB`
    };
  }
  
  return { valid: true };
}
