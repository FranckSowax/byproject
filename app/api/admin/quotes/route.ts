import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create Supabase client with service role to bypass RLS
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
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      );
    }

    // Fetch quotes from legacy supplier_quotes table
    const { data: legacyQuotes, error: legacyError } = await supabaseAdmin
      .from('supplier_quotes')
      .select(`
        *,
        supplier_requests (
          id,
          request_number,
          project_id,
          user_id,
          projects (
            id,
            name,
            user_id
          )
        )
      `)
      .order('submitted_at', { ascending: false });

    if (legacyError) {
      console.error('Error fetching legacy quotes:', legacyError);
    }

    // Fetch quotes from new supplier_tokens table (only submitted ones)
    const { data: tokenQuotes, error: tokenError } = await supabaseAdmin
      .from('supplier_tokens')
      .select(`
        *,
        supplier_requests (
          id,
          request_number,
          project_id,
          user_id,
          projects (
            id,
            name,
            user_id
          )
        )
      `)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (tokenError) {
      console.error('Error fetching token quotes:', tokenError);
    }

    // Transform token quotes to match legacy format
    const transformedTokenQuotes = (tokenQuotes || []).map((token: any) => ({
      id: token.id,
      supplier_request_id: token.supplier_request_id,
      supplier_name: token.supplier_name,
      supplier_email: token.supplier_email,
      supplier_company: token.supplier_company,
      supplier_country: token.supplier_country,
      supplier_phone: token.supplier_phone,
      supplier_whatsapp: token.supplier_whatsapp,
      supplier_wechat: token.supplier_wechat,
      quoted_materials: token.quoted_materials || [],
      status: 'submitted',
      submitted_at: token.submitted_at,
      created_at: token.created_at,
      admin_margin: null,
      sent_to_client_at: null,
      supplier_requests: token.supplier_requests,
      // Mark as new system for frontend handling
      isNewSystem: true,
      tokenId: token.id,
    }));

    // Merge both sources, newest first
    const allQuotes = [
      ...(legacyQuotes || []).map(q => ({ ...q, isNewSystem: false })),
      ...transformedTokenQuotes,
    ].sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.created_at).getTime();
      const dateB = new Date(b.submitted_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ data: allQuotes });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { quoteId, updates, isNewSystem } = body;

    if (!quoteId || !updates) {
      return NextResponse.json(
        { error: 'Missing quoteId or updates' },
        { status: 400 }
      );
    }

    let data;
    let error;

    if (isNewSystem) {
      // Update supplier_tokens table for new system
      const tokenUpdates: any = {};
      if (updates.admin_margin !== undefined) tokenUpdates.admin_margin = updates.admin_margin;
      if (updates.status === 'sent_to_client') tokenUpdates.status = 'sent_to_client';
      if (updates.sent_to_client_at) tokenUpdates.sent_to_client_at = updates.sent_to_client_at;

      const result = await supabaseAdmin
        .from('supplier_tokens')
        .update(tokenUpdates)
        .eq('id', quoteId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Update legacy supplier_quotes table
      const result = await supabaseAdmin
        .from('supplier_quotes')
        .update(updates)
        .eq('id', quoteId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error updating quote:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send quote to client with notification
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      quoteId,
      projectId,
      userId,
      pricesWithMargin,
      supplierId,
      isNewSystem,
      projectName,
      materialCount,
      quotedMaterials, // Original materials with prices from the quote
      supplierInfo, // Supplier contact information
    } = body;

    // 1. Insert prices into the prices table
    if (pricesWithMargin && pricesWithMargin.length > 0) {
      const { error: pricesError } = await supabaseAdmin
        .from('prices')
        .insert(pricesWithMargin);

      if (pricesError) {
        console.error('Error inserting prices:', pricesError);
        return NextResponse.json(
          { error: pricesError.message },
          { status: 500 }
        );
      }
    }

    // 2. Update quote status
    if (isNewSystem) {
      await supabaseAdmin
        .from('supplier_tokens')
        .update({
          status: 'sent_to_client',
          sent_to_client_at: new Date().toISOString(),
        })
        .eq('id', quoteId);
    } else {
      await supabaseAdmin
        .from('supplier_quotes')
        .update({
          status: 'sent_to_client',
          sent_to_client_at: new Date().toISOString(),
        })
        .eq('id', quoteId);
    }

    // 3. Create notification for the client
    if (userId) {
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'quote_received',
          title: 'Nouvelle cotation reçue',
          message: `Les prix de ${materialCount || 'plusieurs'} matériaux ont été ajoutés à votre projet "${projectName || 'Construction'}"`,
          data: {
            project_id: projectId,
            quote_id: quoteId,
            material_count: materialCount,
          },
          link: `/dashboard/projects/${projectId}`,
          icon: 'DollarSign',
          color: 'green',
          read: false,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the whole operation, just log it
      }
    }

    // 4. Store quotations in material_quotations database for historical tracking
    if (quotedMaterials && quotedMaterials.length > 0 && supplierInfo) {
      try {
        // Get exchange rate for conversion
        const { data: exchangeRate } = await supabaseAdmin
          .from('exchange_rates')
          .select('rate')
          .eq('from_currency', 'CNY')
          .eq('to_currency', 'FCFA')
          .single();

        const cnyToFcfaRate = exchangeRate?.rate || 95;

        // Get supplier request info
        const { data: supplierRequest } = await supabaseAdmin
          .from('supplier_requests')
          .select('id, project_id')
          .eq('id', isNewSystem ?
            (await supabaseAdmin.from('supplier_tokens').select('supplier_request_id').eq('id', quoteId).single()).data?.supplier_request_id
            : quoteId
          )
          .single();

        // Prepare material quotations for insertion
        const materialQuotations = quotedMaterials
          .filter((m: any) => m.prices && m.prices.length > 0)
          .flatMap((material: any) => {
            return material.prices.map((price: any) => {
              let convertedPrice = price.amount;
              if (price.currency === 'CNY') {
                convertedPrice = price.amount * cnyToFcfaRate;
              }

              return {
                material_name: material.name,
                material_category: material.category || null,
                original_material_id: material.id || null,
                project_id: projectId || null,
                supplier_email: supplierInfo.email,
                supplier_company: supplierInfo.company,
                supplier_name: supplierInfo.name,
                supplier_country: supplierInfo.country,
                supplier_phone: supplierInfo.phone,
                supplier_whatsapp: supplierInfo.whatsapp,
                supplier_wechat: supplierInfo.wechat,
                unit_price: price.amount,
                currency: price.currency || 'CNY',
                unit: price.unit || null,
                min_quantity: price.minQuantity || null,
                moq: price.moq || null,
                variations: price.variations || [],
                converted_price_fcfa: convertedPrice,
                exchange_rate_used: price.currency === 'CNY' ? cnyToFcfaRate : null,
                source_type: 'quotation',
                source_quote_id: quoteId,
                source_request_id: supplierRequest?.id || null,
                specifications: material.specifications || {},
                notes: price.notes || null,
                images: material.images || [],
                status: 'active',
              };
            });
          });

        if (materialQuotations.length > 0) {
          const { error: quotationsError } = await supabaseAdmin
            .from('material_quotations')
            .insert(materialQuotations);

          if (quotationsError) {
            console.error('Error storing material quotations:', quotationsError);
            // Don't fail the main operation, just log it
          } else {
            console.log(`Stored ${materialQuotations.length} material quotations in database`);
          }
        }
      } catch (quotationError) {
        console.error('Error processing material quotations:', quotationError);
        // Don't fail the main operation
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cotation envoyée au client avec ${pricesWithMargin?.length || 0} prix ajoutés`,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
