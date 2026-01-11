// Types pour l'intégration 1688.com

export interface Product1688 {
  id: string;
  title: string;
  titleChinese: string;
  price: {
    min: number;
    max: number;
    currency: 'CNY';
  };
  priceInFCFA: {
    min: number;
    max: number;
    currency: 'FCFA';
  };
  moq: number; // Minimum Order Quantity
  sold: number;
  repurchaseRate?: number; // Taux de retour de commande (%)
  supplier: {
    name: string;
    location: string;
    yearsOnPlatform?: number;
    rating?: number;
    isVerified?: boolean;
  };
  imageUrl: string;
  productUrl: string;
  specifications?: Record<string, string>;
}

export interface SearchResult1688 {
  searchQuery: string;
  searchQueryChinese?: string;
  results: Product1688[];
  searchedAt: Date;
  totalFound: number;
}

export interface ProductListSearchResult {
  totalProducts: number;
  completedSearches: number;
  failedSearches: number;
  results: SearchResult1688[];
  startedAt: Date;
  completedAt?: Date;
}

export interface ProductDetails1688 extends Product1688 {
  description?: string;
  priceTiers?: PriceTier[];
  stock?: number;
  shippingInfo?: {
    weight?: number;
    dimensions?: string;
    shippingCost?: number;
  };
  attributes?: Record<string, string[]>;
  images?: string[];
  reviews?: {
    count: number;
    rating: number;
  };
}

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: number;
  currency: 'CNY';
}

export interface Search1688Options {
  maxResults?: number;
  translateToChines?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minMOQ?: number;
  maxMOQ?: number;
  minRating?: number;
}

export interface Search1688Error {
  code: string;
  message: string;
  searchQuery?: string;
}

// Taux de conversion CNY -> FCFA (approximatif)
export const CNY_TO_FCFA_RATE = 90;

// Fonction utilitaire pour convertir CNY en FCFA
export function convertCNYtoFCFA(amountCNY: number): number {
  return Math.round(amountCNY * CNY_TO_FCFA_RATE);
}

// Mapping des termes français -> chinois courants
export const FRENCH_TO_CHINESE_TERMS: Record<string, string> = {
  // Construction
  'ciment': '水泥',
  'béton': '混凝土',
  'brique': '砖',
  'carrelage': '瓷砖',
  'carreau': '瓷砖',
  'parquet': '木地板',
  'peinture': '油漆',
  'plâtre': '石膏',
  'fer': '钢铁',
  'acier': '钢',
  'aluminium': '铝',
  'cuivre': '铜',
  'tuyau': '管道',
  'tube': '管',
  'câble': '电缆',
  'fil électrique': '电线',
  'interrupteur': '开关',
  'prise': '插座',
  'robinet': '水龙头',
  'lavabo': '洗手盆',
  'toilette': '马桶',
  'wc': '马桶',
  'douche': '淋浴',
  'baignoire': '浴缸',
  'évier': '水槽',
  'fenêtre': '窗户',
  'porte': '门',
  'serrure': '锁',
  'poignée': '把手',
  'charnière': '铰链',
  'vis': '螺丝',
  'clou': '钉子',
  'boulon': '螺栓',
  'écrou': '螺母',
  // Électricité / Climatisation
  'climatiseur': '空调',
  'ventilateur': '风扇',
  'chauffage': '暖气',
  'chauffe-eau': '热水器',
  'pompe': '水泵',
  'générateur': '发电机',
  'groupe électrogène': '柴油发电机',
  'panneau solaire': '太阳能板',
  'led': 'LED灯',
  'ampoule': '灯泡',
  'lustre': '吊灯',
  'projecteur': '投光灯',
  // Mobilier
  'chaise': '椅子',
  'table': '桌子',
  'bureau': '办公桌',
  'armoire': '衣柜',
  'lit': '床',
  'matelas': '床垫',
  'canapé': '沙发',
  'étagère': '架子',
  // Automobile
  'voiture': '汽车',
  'auto': '汽车',
  'clé': '钥匙',
  'cle': '钥匙',
  'boitier': '外壳',
  'boîtier': '外壳',
  'télécommande': '遥控器',
  'telecommande': '遥控器',
  'batterie': '电池',
  'pneu': '轮胎',
  'roue': '车轮',
  'phare': '车灯',
  'pare-brise': '挡风玻璃',
  'rétroviseur': '后视镜',
  'moteur': '发动机',
  'frein': '刹车',
  'embrayage': '离合器',
  'amortisseur': '减震器',
  'filtre': '过滤器',
  'huile': '机油',
  'essence': '汽油',
  // Électronique
  'téléphone': '手机',
  'telephone': '手机',
  'coque': '手机壳',
  'écran': '屏幕',
  'chargeur': '充电器',
  'casque': '耳机',
  'ordinateur': '电脑',
  'clavier': '键盘',
  'souris': '鼠标',
  'usb': 'USB',
  'hdmi': 'HDMI',
  // Vêtements / Textile
  'vêtement': '服装',
  'tissu': '布料',
  'textile': '纺织品',
  'coton': '棉',
  'soie': '丝绸',
  'cuir': '皮革',
  'chaussure': '鞋子',
  'sac': '包',
  // Général
  'accessoire': '配件',
  'pièce': '零件',
  'piece': '零件',
  'rechange': '备件',
  'plastique': '塑料',
  'verre': '玻璃',
  'bois': '木材',
  'métal': '金属',
  'metal': '金属',
};
