import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

// GET - Get all supplier tokens for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const supabase = createServiceClient();

    // Get supplier tokens
    const { data: tokens, error } = await supabase
      .from('supplier_tokens' as any)
      .select('*')
      .eq('supplier_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tokens:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Format tokens for frontend
    const formattedTokens = tokens.map((t: any, index: number) => ({
      id: t.id,
      label: t.supplier_company || t.supplier_name || `Fournisseur ${index + 1}`,
      token: t.token,
      url: `${baseUrl}/supplier-quote/${t.token}`,
      status: t.status,
      supplierInfo: {
        name: t.supplier_name,
        email: t.supplier_email,
        company: t.supplier_company,
        country: t.supplier_country,
        phone: t.supplier_phone,
        whatsapp: t.supplier_whatsapp,
        wechat: t.supplier_wechat,
      },
      materialsVersion: t.materials_version,
      hasPendingUpdates: t.has_pending_updates,
      quotedMaterials: t.quoted_materials || [],
      viewCount: t.view_count,
      firstViewedAt: t.first_viewed_at,
      lastViewedAt: t.last_viewed_at,
      submittedAt: t.submitted_at,
      expiresAt: t.expires_at,
      createdAt: t.created_at,
    }));

    return NextResponse.json({
      tokens: formattedTokens,
      total: tokens.length
    });
  } catch (error: any) {
    console.error('Error in get tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add more supplier tokens to a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const { count = 1 } = await request.json();
    const supabase = createServiceClient();

    // Get the supplier request with current materials
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !supplierRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Prepare snapshot
    const materialsSnapshot = {
      fr: supplierRequest.materials_data,
      en: supplierRequest.materials_translated_en,
      zh: supplierRequest.materials_translated_zh,
      version: supplierRequest.materials_version || 1,
      created_at: new Date().toISOString()
    };

    // Generate new tokens
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newTokens = [];
    for (let i = 0; i < count; i++) {
      newTokens.push({
        supplier_request_id: requestId,
        token: nanoid(32),
        materials_snapshot: materialsSnapshot,
        materials_version: supplierRequest.materials_version || 1,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });
    }

    const { data: insertedTokens, error: insertError } = await supabase
      .from('supplier_tokens' as any)
      .insert(newTokens)
      .select('id, token');

    if (insertError) {
      console.error('Error creating tokens:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Update num_suppliers in request
    await supabase
      .from('supplier_requests')
      .update({
        num_suppliers: (supplierRequest.num_suppliers || 0) + count
      })
      .eq('id', requestId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formattedTokens = insertedTokens.map((t: any, index: number) => ({
      id: t.id,
      label: `Nouveau fournisseur ${index + 1}`,
      token: t.token,
      url: `${baseUrl}/supplier-quote/${t.token}`
    }));

    return NextResponse.json({
      success: true,
      message: `${count} nouveau(x) lien(s) créé(s)`,
      tokens: formattedTokens
    });
  } catch (error: any) {
    console.error('Error adding tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a specific supplier token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const { tokenId } = await request.json();
    const supabase = createServiceClient();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    // Delete the token
    const { error } = await supabase
      .from('supplier_tokens' as any)
      .delete()
      .eq('id', tokenId)
      .eq('supplier_request_id', requestId);

    if (error) {
      console.error('Error deleting token:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Update num_suppliers
    const { data: remaining } = await supabase
      .from('supplier_tokens' as any)
      .select('id')
      .eq('supplier_request_id', requestId);

    await supabase
      .from('supplier_requests')
      .update({
        num_suppliers: remaining?.length || 0
      })
      .eq('id', requestId);

    return NextResponse.json({
      success: true,
      message: 'Lien fournisseur supprimé'
    });
  } catch (error: any) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
