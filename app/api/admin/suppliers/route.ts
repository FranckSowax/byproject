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

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'quotations'; // 'quotations' | 'database' | 'all'

    if (source === 'database' || source === 'all') {
      // Legacy: Get suppliers from database
      return await getDatabaseSuppliers(supabaseAdmin, source === 'all');
    }

    // Default: Get suppliers from quotations (supplier_quotes + supplier_tokens)
    return await getQuotationSuppliers(supabaseAdmin);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get suppliers from submitted quotations
async function getQuotationSuppliers(supabaseAdmin: any) {
  // 1. Get suppliers from legacy supplier_quotes table
  const { data: legacyQuotes, error: legacyError } = await supabaseAdmin
    .from('supplier_quotes')
    .select(`
      id,
      supplier_name,
      supplier_email,
      supplier_company,
      supplier_country,
      supplier_phone,
      supplier_whatsapp,
      supplier_wechat,
      quoted_materials,
      status,
      submitted_at,
      created_at,
      supplier_request_id,
      supplier_requests (
        id,
        request_number,
        project_id,
        projects (
          id,
          name
        )
      )
    `)
    .in('status', ['submitted', 'sent_to_client'])
    .order('submitted_at', { ascending: false });

  if (legacyError) {
    console.error('Error fetching legacy quotes:', legacyError);
  }

  // 2. Get suppliers from new supplier_tokens table
  const { data: tokenQuotes, error: tokenError } = await supabaseAdmin
    .from('supplier_tokens')
    .select(`
      id,
      supplier_name,
      supplier_email,
      supplier_company,
      supplier_country,
      supplier_phone,
      supplier_whatsapp,
      supplier_wechat,
      quoted_materials,
      status,
      submitted_at,
      created_at,
      supplier_request_id,
      supplier_requests (
        id,
        request_number,
        project_id,
        projects (
          id,
          name
        )
      )
    `)
    .in('status', ['submitted', 'sent_to_client'])
    .order('submitted_at', { ascending: false });

  if (tokenError) {
    console.error('Error fetching token quotes:', tokenError);
  }

  // 3. Merge and deduplicate suppliers by email/company
  const supplierMap = new Map<string, any>();

  const processQuote = (quote: any, isNewSystem: boolean) => {
    // Create a unique key based on email or company name
    const key = (quote.supplier_email || quote.supplier_company || quote.supplier_name || '').toLowerCase().trim();
    if (!key) return;

    const existing = supplierMap.get(key);

    // Extract materials quoted
    const materialsQuoted = (quote.quoted_materials || []).map((m: any) => ({
      name: m.name,
      hasPrices: m.prices && m.prices.length > 0,
      priceCount: m.prices?.length || 0,
    }));

    const quotation = {
      id: quote.id,
      requestNumber: quote.supplier_requests?.request_number,
      projectName: quote.supplier_requests?.projects?.name,
      projectId: quote.supplier_requests?.project_id,
      materialsCount: materialsQuoted.filter((m: any) => m.hasPrices).length,
      submittedAt: quote.submitted_at,
      status: quote.status,
      isNewSystem,
    };

    if (existing) {
      // Update existing supplier with additional quotation
      existing.quotations.push(quotation);
      existing.totalQuotations += 1;
      existing.totalMaterialsQuoted += quotation.materialsCount;

      // Update last activity
      if (new Date(quote.submitted_at) > new Date(existing.lastActivityAt)) {
        existing.lastActivityAt = quote.submitted_at;
      }

      // Merge materials
      materialsQuoted.forEach((m: any) => {
        if (m.hasPrices && !existing.materialsSupplied.includes(m.name)) {
          existing.materialsSupplied.push(m.name);
        }
      });
    } else {
      // Create new supplier entry
      supplierMap.set(key, {
        id: key, // Use email/company as ID for grouping
        name: quote.supplier_company || quote.supplier_name,
        email: quote.supplier_email,
        company: quote.supplier_company,
        country: quote.supplier_country,
        contactName: quote.supplier_name,
        phone: quote.supplier_phone,
        whatsapp: quote.supplier_whatsapp,
        wechat: quote.supplier_wechat,
        quotations: [quotation],
        totalQuotations: 1,
        totalMaterialsQuoted: quotation.materialsCount,
        materialsSupplied: materialsQuoted.filter((m: any) => m.hasPrices).map((m: any) => m.name),
        firstQuotationAt: quote.submitted_at || quote.created_at,
        lastActivityAt: quote.submitted_at || quote.created_at,
        source: isNewSystem ? 'new_system' : 'legacy',
      });
    }
  };

  // Process legacy quotes
  (legacyQuotes || []).forEach((quote: any) => processQuote(quote, false));

  // Process new system quotes
  (tokenQuotes || []).forEach((quote: any) => processQuote(quote, true));

  // Convert to array and sort by last activity
  const suppliers = Array.from(supplierMap.values()).sort((a, b) => {
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });

  // Calculate stats
  const stats = {
    totalSuppliers: suppliers.length,
    totalQuotations: suppliers.reduce((sum, s) => sum + s.totalQuotations, 0),
    totalMaterials: suppliers.reduce((sum, s) => sum + s.materialsSupplied.length, 0),
    byCountry: suppliers.reduce((acc: any, s) => {
      const country = s.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json({
    suppliers,
    stats,
    source: 'quotations',
  });
}

// Legacy: Get suppliers from database
async function getDatabaseSuppliers(supabaseAdmin: any, includeQuotationData: boolean) {
  const { data: suppliers, error: suppliersError } = await supabaseAdmin
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (suppliersError) {
    console.error('Error fetching suppliers:', suppliersError);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }

  // Enrich with keywords and counts
  const enrichedSuppliers = await Promise.all(suppliers.map(async (supplier: any) => {
    // Get materials via prices table linked to this supplier
    const { data: prices } = await supabaseAdmin
      .from('prices')
      .select('materials(name)')
      .eq('supplier_id', supplier.id);

    const materialNames = new Set<string>();
    if (prices) {
      prices.forEach((p: any) => {
        if (p.materials?.name) {
          materialNames.add(p.materials.name);
        }
      });
    }

    return {
      ...supplier,
      materials_count: materialNames.size,
      keywords: Array.from(materialNames),
      source: 'database',
    };
  }));

  return NextResponse.json(enrichedSuppliers);
}

// POST - Add supplier to database (optional - for manual addition)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({
        name: body.name,
        email: body.email,
        country: body.country,
        contact_name: body.contactName,
        phone: body.phone,
        whatsapp: body.whatsapp,
        wechat: body.wechat,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding supplier:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
