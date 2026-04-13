import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { convertCurrency } from '@/lib/types/marketplace';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/client-requests/[id]/results/curate
 * Admin sélectionne les résultats et fixe les marges pour la proposition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { selections, default_margin_percent } = body;

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'Les sélections sont requises' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    let updatedCount = 0;
    for (const selection of selections) {
      const { result_id, is_selected, margin_percent, quantity } = selection;

      const updateData: Record<string, any> = {
        is_selected: is_selected ?? false,
      };

      if (margin_percent !== undefined) {
        updateData.admin_margin_percent = margin_percent;
      } else if (default_margin_percent !== undefined) {
        updateData.admin_margin_percent = default_margin_percent;
      }

      if (quantity !== undefined) {
        updateData.quantity = quantity;
      }

      // Calculate client price with margin
      if (is_selected) {
        const { data: result } = await supabase
          .from('marketplace_search_results')
          .select('price_min, currency')
          .eq('id', result_id)
          .single();

        if (result && result.price_min) {
          const margin = updateData.admin_margin_percent || default_margin_percent || 20;
          const priceWithMargin = result.price_min * (1 + margin / 100);
          updateData.client_price = convertCurrency(priceWithMargin, result.currency || 'CNY', 'EUR');
          updateData.client_currency = 'EUR';
        }
      }

      const { error } = await supabase
        .from('marketplace_search_results')
        .update(updateData)
        .eq('id', result_id);

      if (!error) updatedCount++;
    }

    // Update item statuses to 'curated' for items with selected results
    const { data: items } = await supabase
      .from('client_request_items')
      .select('id')
      .eq('client_request_id', id);

    if (items) {
      for (const item of items) {
        const { count } = await supabase
          .from('marketplace_search_results')
          .select('*', { count: 'exact', head: true })
          .eq('client_request_item_id', item.id)
          .eq('is_selected', true);

        if (count && count > 0) {
          await supabase
            .from('client_request_items')
            .update({ status: 'curated' })
            .eq('id', item.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
