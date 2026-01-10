import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create Supabase admin client
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// GET - Fetch material quotations with filtering and aggregation
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    // Query parameters
    const materialName = searchParams.get('material');
    const supplierEmail = searchParams.get('supplier');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const view = searchParams.get('view') || 'list'; // 'list', 'comparison', 'by_supplier', 'stats'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query based on view type
    if (view === 'comparison') {
      // Price comparison across suppliers
      return await getMaterialComparison(supabaseAdmin, { materialName, category, country });
    }

    if (view === 'by_supplier') {
      // Quotations grouped by supplier
      return await getQuotationsBySupplier(supabaseAdmin, { materialName, country, category });
    }

    if (view === 'stats') {
      // Overall statistics
      return await getQuotationStats(supabaseAdmin, { materialName, country, category });
    }

    // Default: list view
    let query = supabaseAdmin
      .from('material_quotations')
      .select('*', { count: 'exact' });

    // Apply filters
    if (materialName) {
      query = query.ilike('material_name', `%${materialName}%`);
    }
    if (supplierEmail) {
      query = query.eq('supplier_email', supplierEmail);
    }
    if (country) {
      query = query.eq('supplier_country', country);
    }
    if (category) {
      query = query.eq('material_category', category);
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching material quotations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique materials and countries for filters
    const { data: filterOptions } = await supabaseAdmin
      .from('material_quotations')
      .select('material_name, material_category, supplier_country')
      .eq('status', 'active');

    const uniqueMaterials = [...new Set(filterOptions?.map(f => f.material_name) || [])];
    const uniqueCategories = [...new Set(filterOptions?.map(f => f.material_category).filter(Boolean) || [])];
    const uniqueCountries = [...new Set(filterOptions?.map(f => f.supplier_country).filter(Boolean) || [])];

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
      filters: {
        materials: uniqueMaterials,
        categories: uniqueCategories,
        countries: uniqueCountries,
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get price comparison across suppliers
async function getMaterialComparison(supabase: any, filters: any) {
  let query = supabase.rpc('get_material_price_comparison');

  // If we have a view, use it. Otherwise, build aggregation manually
  const { data: materials, error } = await supabase
    .from('material_quotations')
    .select('material_name, material_category')
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group and aggregate manually
  const materialNames = [...new Set(materials?.map((m: any) => m.material_name) || [])];

  const comparisons = await Promise.all(
    materialNames.slice(0, 50).map(async (materialName: string) => {
      const { data: quotes } = await supabase
        .from('material_quotations')
        .select('*')
        .eq('material_name', materialName)
        .eq('status', 'active')
        .order('unit_price', { ascending: true });

      if (!quotes || quotes.length === 0) return null;

      const prices = quotes.map((q: any) => q.unit_price);
      const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

      return {
        material_name: materialName,
        material_category: quotes[0]?.material_category,
        supplier_count: new Set(quotes.map((q: any) => q.supplier_email)).size,
        quotation_count: quotes.length,
        avg_price: Math.round(avgPrice * 100) / 100,
        lowest_price: Math.min(...prices),
        highest_price: Math.max(...prices),
        price_range: Math.max(...prices) - Math.min(...prices),
        most_common_currency: quotes[0]?.currency,
        lowest_quote: quotes[0],
        all_quotes: quotes,
      };
    })
  );

  return NextResponse.json({
    data: comparisons.filter(Boolean),
    total: comparisons.filter(Boolean).length,
  });
}

// Get quotations grouped by supplier
async function getQuotationsBySupplier(supabase: any, filters: any) {
  const { data: quotations, error } = await supabase
    .from('material_quotations')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by supplier
  const supplierMap = new Map<string, any>();

  quotations?.forEach((q: any) => {
    const key = q.supplier_email;
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplier_email: q.supplier_email,
        supplier_company: q.supplier_company,
        supplier_name: q.supplier_name,
        supplier_country: q.supplier_country,
        supplier_phone: q.supplier_phone,
        supplier_whatsapp: q.supplier_whatsapp,
        supplier_wechat: q.supplier_wechat,
        materials: [],
        total_quotations: 0,
        first_quotation: q.created_at,
        last_quotation: q.created_at,
      });
    }

    const supplier = supplierMap.get(key)!;
    supplier.materials.push({
      material_name: q.material_name,
      material_category: q.material_category,
      unit_price: q.unit_price,
      currency: q.currency,
      unit: q.unit,
      created_at: q.created_at,
    });
    supplier.total_quotations += 1;

    if (new Date(q.created_at) > new Date(supplier.last_quotation)) {
      supplier.last_quotation = q.created_at;
    }
    if (new Date(q.created_at) < new Date(supplier.first_quotation)) {
      supplier.first_quotation = q.created_at;
    }
  });

  const suppliers = Array.from(supplierMap.values()).sort(
    (a, b) => b.total_quotations - a.total_quotations
  );

  return NextResponse.json({
    data: suppliers,
    total: suppliers.length,
  });
}

// Get overall statistics
async function getQuotationStats(supabase: any, filters: any) {
  const { data: quotations, error } = await supabase
    .from('material_quotations')
    .select('*')
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueSuppliers = new Set(quotations?.map((q: any) => q.supplier_email) || []);
  const uniqueMaterials = new Set(quotations?.map((q: any) => q.material_name) || []);
  const uniqueCountries = new Set(quotations?.map((q: any) => q.supplier_country).filter(Boolean) || []);

  // Price distribution by currency
  const byCurrency: Record<string, number> = {};
  quotations?.forEach((q: any) => {
    byCurrency[q.currency] = (byCurrency[q.currency] || 0) + 1;
  });

  // By country
  const byCountry: Record<string, number> = {};
  quotations?.forEach((q: any) => {
    if (q.supplier_country) {
      byCountry[q.supplier_country] = (byCountry[q.supplier_country] || 0) + 1;
    }
  });

  // By category
  const byCategory: Record<string, number> = {};
  quotations?.forEach((q: any) => {
    if (q.material_category) {
      byCategory[q.material_category] = (byCategory[q.material_category] || 0) + 1;
    }
  });

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentQuotations = quotations?.filter(
    (q: any) => new Date(q.created_at) > thirtyDaysAgo
  ).length || 0;

  return NextResponse.json({
    stats: {
      total_quotations: quotations?.length || 0,
      unique_suppliers: uniqueSuppliers.size,
      unique_materials: uniqueMaterials.size,
      unique_countries: uniqueCountries.size,
      recent_quotations_30d: recentQuotations,
      by_currency: byCurrency,
      by_country: byCountry,
      by_category: byCategory,
    },
  });
}

// POST - Add material quotations (from quote submission)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const {
      quotations, // Array of quotations to add
      source_quote_id,
      source_request_id,
      supplier_info,
    } = body;

    if (!quotations || !Array.isArray(quotations) || quotations.length === 0) {
      return NextResponse.json({ error: 'No quotations provided' }, { status: 400 });
    }

    // Get current exchange rate for conversion
    const { data: exchangeRate } = await supabaseAdmin
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'CNY')
      .eq('to_currency', 'FCFA')
      .single();

    const cnyToFcfaRate = exchangeRate?.rate || 95;

    // Prepare quotations for insertion
    const quotationsToInsert = quotations.map((q: any) => {
      let convertedPrice = q.unit_price;
      if (q.currency === 'CNY') {
        convertedPrice = q.unit_price * cnyToFcfaRate;
      }

      return {
        material_name: q.material_name,
        material_category: q.material_category || null,
        original_material_id: q.original_material_id || null,
        project_id: q.project_id || null,
        supplier_email: supplier_info?.email || q.supplier_email,
        supplier_company: supplier_info?.company || q.supplier_company,
        supplier_name: supplier_info?.name || q.supplier_name,
        supplier_country: supplier_info?.country || q.supplier_country,
        supplier_phone: supplier_info?.phone || q.supplier_phone,
        supplier_whatsapp: supplier_info?.whatsapp || q.supplier_whatsapp,
        supplier_wechat: supplier_info?.wechat || q.supplier_wechat,
        unit_price: q.unit_price,
        currency: q.currency || 'CNY',
        unit: q.unit || null,
        min_quantity: q.min_quantity || null,
        moq: q.moq || null,
        variations: q.variations || [],
        converted_price_fcfa: convertedPrice,
        exchange_rate_used: q.currency === 'CNY' ? cnyToFcfaRate : null,
        source_type: 'quotation',
        source_quote_id: source_quote_id || null,
        source_request_id: source_request_id || null,
        specifications: q.specifications || {},
        notes: q.notes || null,
        images: q.images || [],
        status: 'active',
      };
    });

    const { data, error } = await supabaseAdmin
      .from('material_quotations')
      .insert(quotationsToInsert)
      .select();

    if (error) {
      console.error('Error inserting material quotations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} cotations de matériaux enregistrées`,
      data,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update quotation status or details
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quotation ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('material_quotations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quotation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
