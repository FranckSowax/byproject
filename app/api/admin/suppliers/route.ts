import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client with service role key
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

    // Get all suppliers
    const { data: suppliers, error: suppliersError } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }

    // Enrich with keywords and counts
    const enrichedSuppliers = await Promise.all(suppliers.map(async (supplier) => {
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
        keywords: Array.from(materialNames)
      };
    }));

    return NextResponse.json(enrichedSuppliers);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
