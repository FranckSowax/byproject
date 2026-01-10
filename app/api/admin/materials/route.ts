import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Load all materials with their projects and prices
    const { data: materialsData, error: materialsError } = await supabaseAdmin
      .from('materials')
      .select(`
        *,
        project:projects(id, name),
        prices(
          id,
          amount,
          currency,
          converted_amount,
          country,
          created_at,
          notes,
          variations,
          supplier:suppliers(id, name, email, country)
        )
      `)
      .order('name');

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return NextResponse.json(
        { error: materialsError.message },
        { status: 500 }
      );
    }

    // Load supplier tokens with quoted materials (new quotation system)
    const { data: supplierTokens, error: tokensError } = await supabaseAdmin
      .from('supplier_tokens')
      .select(`
        id,
        token,
        supplier_name,
        supplier_email,
        supplier_company,
        supplier_country,
        status,
        quoted_materials,
        materials_snapshot,
        submitted_at,
        supplier_requests(
          id,
          project_id,
          projects:project_id(id, name)
        )
      `)
      .in('status', ['submitted', 'in_progress'])
      .not('quoted_materials', 'is', null);

    if (tokensError) {
      console.error('Error fetching supplier tokens:', tokensError);
      // Continue without tokens data
    }

    // Process supplier tokens to extract quoted materials with prices
    const quotedMaterialsFromTokens: any[] = [];

    if (supplierTokens) {
      for (const token of supplierTokens) {
        const quotedMaterials = token.quoted_materials || [];
        const supplierRequest = token.supplier_requests as any;
        const project = supplierRequest?.projects;

        for (const quotedMat of quotedMaterials) {
          // Only include materials with prices
          if (quotedMat.prices && quotedMat.prices.length > 0) {
            quotedMaterialsFromTokens.push({
              id: quotedMat.id,
              name: quotedMat.name || quotedMat.translatedName,
              original_name: quotedMat.originalName || quotedMat.name,
              description: quotedMat.description || quotedMat.translatedDescription,
              category: quotedMat.category,
              quantity: quotedMat.quantity,
              images: quotedMat.images || quotedMat.supplierImages || [],
              project_id: supplierRequest?.project_id,
              project_name: project?.name || 'Unknown',
              supplier: {
                id: token.id,
                name: token.supplier_company || token.supplier_name,
                email: token.supplier_email,
                country: token.supplier_country,
              },
              prices: quotedMat.prices.map((p: any) => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency || 'CNY',
                country: token.supplier_country || 'Chine',
                supplier_name: token.supplier_company || token.supplier_name,
                variations: p.variations || [],
                created_at: token.submitted_at,
              })),
              source: 'quotation',
              submitted_at: token.submitted_at,
            });
          }
        }
      }
    }

    // Merge materials from database with quoted materials from tokens
    const allMaterials = [
      ...materialsData.map((mat: any) => ({
        ...mat,
        source: 'database',
      })),
    ];

    // Add quoted materials that don't exist in database
    for (const quotedMat of quotedMaterialsFromTokens) {
      const exists = allMaterials.some(
        (m: any) => m.id === quotedMat.id ||
        (m.name?.toLowerCase() === quotedMat.name?.toLowerCase() && m.project_id === quotedMat.project_id)
      );

      if (!exists) {
        allMaterials.push(quotedMat);
      } else {
        // Merge prices from quotation into existing material
        const existingMat = allMaterials.find(
          (m: any) => m.id === quotedMat.id ||
          (m.name?.toLowerCase() === quotedMat.name?.toLowerCase() && m.project_id === quotedMat.project_id)
        );
        if (existingMat && quotedMat.prices) {
          existingMat.quotation_prices = [
            ...(existingMat.quotation_prices || []),
            ...quotedMat.prices.map((p: any) => ({
              ...p,
              source: 'quotation',
              supplier: quotedMat.supplier,
            })),
          ];
        }
      }
    }

    return NextResponse.json(allMaterials);

  } catch (error: any) {
    console.error('Error in materials API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
