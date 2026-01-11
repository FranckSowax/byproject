import { NextRequest, NextResponse } from 'next/server';
import {
  search1688Product,
  search1688ProductByImage,
  searchProductList,
  searchQuoteRequestProducts,
} from '@/lib/services/1688-service';
import { Search1688Options } from '@/lib/types/1688';
import { createServiceClient } from '@/lib/supabase/service';

export const maxDuration = 25; // 25 secondes pour rester sous la limite Netlify
export const dynamic = 'force-dynamic';

/**
 * POST /api/1688/search
 *
 * Body:
 * - products: string[] - Liste des produits à rechercher
 * - projectId?: string - ID du projet (pour récupérer les matériaux)
 * - options?: Search1688Options - Options de recherche
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, projectId, options = {} } = body;

    // Vérifier l'authentification (optionnel mais recommandé)
    const supabase = createServiceClient();

    // Si un projectId est fourni, récupérer les matériaux du projet
    if (projectId) {
      console.log(`[1688 API] Searching products for project: ${projectId}`);

      const { data: materials, error } = await supabase
        .from('materials')
        .select('id, name, description, quantity, images')
        .eq('project_id', projectId);

      if (error) {
        console.error('[1688 API] Error fetching materials:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des matériaux' },
          { status: 500 }
        );
      }

      if (!materials || materials.length === 0) {
        return NextResponse.json(
          { error: 'Aucun matériau trouvé pour ce projet' },
          { status: 404 }
        );
      }

      console.log(`[1688 API] Found ${materials.length} materials for project`);

      const results = await searchQuoteRequestProducts(materials, options as Search1688Options);

      // Sauvegarder les résultats dans la base de données si besoin
      // TODO: Créer une table pour stocker les résultats 1688

      return NextResponse.json({
        success: true,
        projectId,
        ...results,
      });
    }

    // Sinon, utiliser la liste de produits fournie
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'La liste des produits est requise' },
        { status: 400 }
      );
    }

    console.log(`[1688 API] Searching ${products.length} products`);

    // Limite le nombre de produits pour éviter les abus
    const maxProducts = 20;
    if (products.length > maxProducts) {
      return NextResponse.json(
        { error: `Maximum ${maxProducts} produits par requête` },
        { status: 400 }
      );
    }

    const results = await searchProductList(products, options as Search1688Options);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[1688 API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/1688/search?q=keyword&maxResults=5&imageUrl=xxx
 *
 * Recherche simple d'un seul produit
 * Privilégie la recherche par image si imageUrl est fourni
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('q');
    const imageUrl = searchParams.get('imageUrl');
    const maxResults = parseInt(searchParams.get('maxResults') || '5', 10);

    // Privilégier la recherche par image si disponible
    if (imageUrl) {
      console.log(`[1688 API] Image search for: ${imageUrl.substring(0, 100)}...`);
      console.log(`[1688 API] Keyword fallback available: ${keyword ? 'yes' : 'no'}`);

      try {
        const result = await search1688ProductByImage(imageUrl, { maxResults });
        console.log(`[1688 API] Image search successful, found ${result.results?.length || 0} results`);
        return NextResponse.json({
          success: true,
          searchType: 'image',
          ...result,
        });
      } catch (imageError: any) {
        console.warn(`[1688 API] Image search failed: ${imageError.message}`);
        console.warn(`[1688 API] Full error:`, imageError);

        // Fallback to keyword search if image search fails
        if (keyword) {
          console.log(`[1688 API] Falling back to keyword search: "${keyword}"`);
          try {
            const result = await search1688Product(keyword, { maxResults });
            console.log(`[1688 API] Keyword fallback successful, found ${result.results?.length || 0} results`);
            return NextResponse.json({
              success: true,
              searchType: 'keyword_fallback',
              ...result,
            });
          } catch (keywordError: any) {
            console.error(`[1688 API] Keyword fallback also failed: ${keywordError.message}`);
            throw keywordError;
          }
        }
        throw imageError;
      }
    }

    if (!keyword) {
      return NextResponse.json(
        { error: 'Le paramètre q (keyword) ou imageUrl est requis' },
        { status: 400 }
      );
    }

    console.log(`[1688 API] Keyword search for: ${keyword}`);

    const result = await search1688Product(keyword, { maxResults });

    return NextResponse.json({
      success: true,
      searchType: 'keyword',
      ...result,
    });
  } catch (error: any) {
    console.error('[1688 API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
