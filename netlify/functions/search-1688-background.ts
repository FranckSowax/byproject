import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'c681296a52mshc2c73586baf893bp135671jsn76eb375db9e7';
const RAPIDAPI_HOST = '1688-datahub.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

// French to Chinese translation mapping
const FRENCH_TO_CHINESE_TERMS: Record<string, string> = {
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

const CNY_TO_FCFA_RATE = 90;

function translateToChines(text: string): string {
  const lowerText = text.toLowerCase().trim();
  if (FRENCH_TO_CHINESE_TERMS[lowerText]) {
    return FRENCH_TO_CHINESE_TERMS[lowerText];
  }
  for (const [french, chinese] of Object.entries(FRENCH_TO_CHINESE_TERMS)) {
    if (lowerText.includes(french)) {
      return lowerText.replace(french, chinese);
    }
  }
  return text;
}

function convertCNYtoFCFA(amountCNY: number): number {
  return Math.round(amountCNY * CNY_TO_FCFA_RATE);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchRapidAPI(keyword: string, pageSize: number = 20): Promise<any[]> {
  const url = `${RAPIDAPI_BASE_URL}/item_search?q=${encodeURIComponent(keyword)}&page=1&pageSize=${pageSize}&sort=default`;

  console.log(`[1688 BG] RapidAPI search: "${keyword}" (pageSize: ${pageSize})`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[1688 BG] RapidAPI error:`, errorText);
      throw new Error(`RapidAPI failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`[1688 BG] RapidAPI response received`);

    // L'API retourne les items dans différents formats possibles
    const items = data?.result?.resultList || data?.items || data?.data || [];
    console.log(`[1688 BG] Found ${items.length} items`);

    return items;
  } catch (error: any) {
    console.error(`[1688 BG] RapidAPI error:`, error.message);
    throw error;
  }
}

function parseRapidAPIResults(rawResults: any[]): any[] {
  return rawResults.map((item, index) => {
    // RapidAPI 1688-datahub format
    let priceMin = 0;
    let priceMax = 0;

    if (item.price) {
      if (typeof item.price === 'string') {
        const priceParts = item.price.split('-');
        priceMin = parseFloat(priceParts[0]) || 0;
        priceMax = parseFloat(priceParts[1] || priceParts[0]) || priceMin;
      } else if (typeof item.price === 'number') {
        priceMin = item.price;
        priceMax = item.price;
      }
    }
    if (item.priceMin) priceMin = parseFloat(item.priceMin);
    if (item.priceMax) priceMax = parseFloat(item.priceMax);
    if (priceMax === 0) priceMax = priceMin;

    const productId = item.offerId || item.id || item.itemId || item.productId || `1688-${index}-${Date.now()}`;

    let productUrl = item.productUrl || item.url || item.detailUrl || item.itemUrl || '';
    if (!productUrl && productId) {
      productUrl = `https://detail.1688.com/offer/${productId}.html`;
    }

    return {
      id: String(productId),
      title: item.title || item.name || item.subject || 'Unknown',
      titleChinese: item.title || item.subject || '',
      price: { min: priceMin, max: priceMax, currency: 'CNY' },
      priceInFCFA: {
        min: convertCNYtoFCFA(priceMin),
        max: convertCNYtoFCFA(priceMax),
        currency: 'FCFA',
      },
      moq: parseInt(item.moq || item.minOrder || item.beginAmount || '1', 10),
      sold: parseInt(item.sold || item.salesCount || item.monthSold || item.gmvMonthCount || '0', 10),
      supplier: {
        name: item.supplierName || item.companyName || item.sellerName || item.shopName || 'Unknown',
        location: item.supplierLocation || item.location || item.sellerProvince || 'China',
        yearsOnPlatform: item.yearsOnPlatform ? parseInt(item.yearsOnPlatform, 10) : undefined,
        rating: item.supplierRating || item.sellerReputation ? parseFloat(item.supplierRating || item.sellerReputation) : undefined,
        isVerified: item.isVerified || item.isTp || false,
      },
      imageUrl: item.imageUrl || item.image || item.mainImage || item.imgUrl || item.picUrl || '',
      productUrl: productUrl,
    };
  });
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('[1688 BG] Background function started');

  // Parse the job ID from the request
  let jobId: string;
  try {
    const body = JSON.parse(event.body || '{}');
    jobId = body.jobId;
    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'jobId is required' }) };
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  console.log(`[1688 BG] Processing job: ${jobId}`);

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('search_jobs_1688')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[1688 BG] Job not found:', jobError);
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }

    if (job.status !== 'pending') {
      console.log(`[1688 BG] Job already ${job.status}, skipping`);
      return { statusCode: 200, body: JSON.stringify({ message: `Job already ${job.status}` }) };
    }

    // 2. Update job status to running
    await supabase
      .from('search_jobs_1688')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    const searchTerms: string[] = job.search_terms || [];
    const options = job.options || {};
    const maxResults = options.maxResults || 10; // RapidAPI est plus rapide qu'Apify
    const results: any[] = [];
    let failedTerms = 0;

    console.log(`[1688 BG] Processing ${searchTerms.length} search terms`);

    // 3. Process each search term
    for (let i = 0; i < searchTerms.length; i++) {
      const term = searchTerms[i];
      const searchKeyword = translateToChines(term);

      console.log(`[1688 BG] Searching ${i + 1}/${searchTerms.length}: "${term}" -> "${searchKeyword}"`);

      // Update progress
      await supabase
        .from('search_jobs_1688')
        .update({
          completed_terms: i,
          current_term: term,
        })
        .eq('id', jobId);

      try {
        const rawResults = await searchRapidAPI(searchKeyword, maxResults);
        const products = parseRapidAPIResults(rawResults);

        results.push({
          searchQuery: term,
          searchQueryChinese: searchKeyword !== term ? searchKeyword : undefined,
          results: products,
          searchedAt: new Date().toISOString(),
          totalFound: products.length,
        });

        console.log(`[1688 BG] Found ${products.length} products for "${term}"`);
      } catch (error: any) {
        console.error(`[1688 BG] Error searching "${term}":`, error.message);
        failedTerms++;
        results.push({
          searchQuery: term,
          results: [],
          searchedAt: new Date().toISOString(),
          totalFound: 0,
          error: error.message,
        });
      }

      // Rate limiting between requests (1 second for RapidAPI)
      if (i < searchTerms.length - 1) {
        await delay(1000);
      }
    }

    // 4. Update job with final results
    await supabase
      .from('search_jobs_1688')
      .update({
        status: 'completed',
        completed_terms: searchTerms.length,
        failed_terms: failedTerms,
        current_term: null,
        results: results,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[1688 BG] Job ${jobId} completed: ${searchTerms.length - failedTerms} succeeded, ${failedTerms} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        jobId,
        totalTerms: searchTerms.length,
        completedTerms: searchTerms.length - failedTerms,
        failedTerms,
      }),
    };
  } catch (error: any) {
    console.error('[1688 BG] Fatal error:', error);

    // Update job status to failed
    await supabase
      .from('search_jobs_1688')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { handler };
