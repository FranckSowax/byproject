// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET - Load supplier request by token (supports both old public_token and new supplier_tokens)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { token } = await params;

    // First, try to find in supplier_tokens (new system)
    const { data: supplierToken, error: tokenError } = await supabase
      .from('supplier_tokens' as any)
      .select('*, supplier_requests(*)')
      .eq('token', token)
      .single();

    if (supplierToken) {
      // New system: supplier_tokens
      return handleSupplierToken(supabase, supplierToken, request);
    }

    // Fallback: try old system with public_token
    const { data: supplierRequest, error } = await supabase
      .from('supplier_requests' as any)
      .select('*')
      .eq('public_token', token)
      .single();

    if (error || !supplierRequest) {
      console.error('Error fetching supplier request:', error);
      return NextResponse.json(
        { error: 'Request not found', details: error?.message },
        { status: 404 }
      );
    }

    // Old system: public_token on supplier_requests
    return handleLegacyToken(supabase, supplierRequest, request);
  } catch (error) {
    console.error('Error loading supplier request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle new supplier_tokens system
async function handleSupplierToken(supabase: any, supplierToken: any, request: NextRequest) {
  const supplierRequest = supplierToken.supplier_requests;

  // Check if expired
  if (supplierToken.expires_at && new Date(supplierToken.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Request expired' },
      { status: 410 }
    );
  }

  // Get project name
  const { data: project } = await supabase
    .from('projects' as any)
    .select('name')
    .eq('id', supplierRequest.project_id)
    .single();

  // Update view tracking
  const isFirstView = !supplierToken.first_viewed_at;
  await supabase
    .from('supplier_tokens' as any)
    .update({
      status: supplierToken.status === 'pending' ? 'viewed' : supplierToken.status,
      first_viewed_at: supplierToken.first_viewed_at || new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      view_count: (supplierToken.view_count || 0) + 1
    })
    .eq('id', supplierToken.id);

  // Get materials from snapshot
  const materialsSnapshot = supplierToken.materials_snapshot || {};
  const materialsFr = materialsSnapshot.fr || supplierRequest.materials_data || [];
  const materialsEn = materialsSnapshot.en || supplierRequest.materials_translated_en || materialsFr;
  const materialsZh = materialsSnapshot.zh || supplierRequest.materials_translated_zh || materialsFr;

  // Check for pending updates from client
  const hasPendingUpdates = supplierToken.has_pending_updates;
  const pendingUpdates = supplierToken.pending_updates || [];

  return NextResponse.json({
    tokenId: supplierToken.id,
    isNewSystem: true,
    request: {
      id: supplierRequest.id,
      request_number: supplierRequest.request_number,
      project_id: supplierRequest.project_id,
      project_name: project?.name || 'Construction Project',
      materials_data: materialsFr,
      materials_translated_en: materialsEn,
      materials_translated_zh: materialsZh,
      total_materials: materialsFr.length,
      status: supplierRequest.status,
      created_at: supplierRequest.created_at,
    },
    supplierInfo: {
      name: supplierToken.supplier_name,
      email: supplierToken.supplier_email,
      company: supplierToken.supplier_company,
      country: supplierToken.supplier_country,
      phone: supplierToken.supplier_phone,
      whatsapp: supplierToken.supplier_whatsapp,
      wechat: supplierToken.supplier_wechat,
    },
    quotedMaterials: supplierToken.quoted_materials || [],
    status: supplierToken.status,
    hasPendingUpdates,
    pendingUpdates,
    materialsVersion: supplierToken.materials_version,
  });
}

// Handle legacy public_token system
async function handleLegacyToken(supabase: any, supplierRequest: any, request: NextRequest) {
  // Get project name separately
  const { data: project } = await supabase
    .from('projects' as any)
    .select('name')
    .eq('id', supplierRequest.project_id)
    .single();

  // Check if expired
  if (supplierRequest.expires_at && new Date(supplierRequest.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Request expired' },
      { status: 410 }
    );
  }

  // Check for existing quote (draft)
  const { data: existingQuote } = await supabase
    .from('supplier_quotes' as any)
    .select('*')
    .eq('supplier_request_id', supplierRequest.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Check if translations are missing and translate on-demand
  let materialsEn = supplierRequest.materials_translated_en;
  let materialsZh = supplierRequest.materials_translated_zh;

  if (!materialsEn || (Array.isArray(materialsEn) && materialsEn.length === 0)) {
    try {
      const translateResponse = await fetch(
        `${request.nextUrl.origin}/api/translate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materials: supplierRequest.materials_data,
            targetLanguage: 'en',
          }),
        }
      );
      if (translateResponse.ok) {
        const { translations } = await translateResponse.json();
        materialsEn = translations;
        await supabase
          .from('supplier_requests' as any)
          .update({ materials_translated_en: materialsEn })
          .eq('id', supplierRequest.id);
      }
    } catch (error) {
      console.error('Error translating to English:', error);
      materialsEn = supplierRequest.materials_data;
    }
  }

  if (!materialsZh || (Array.isArray(materialsZh) && materialsZh.length === 0)) {
    try {
      const translateResponse = await fetch(
        `${request.nextUrl.origin}/api/translate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materials: supplierRequest.materials_data,
            targetLanguage: 'zh',
          }),
        }
      );
      if (translateResponse.ok) {
        const { translations } = await translateResponse.json();
        materialsZh = translations;
        await supabase
          .from('supplier_requests' as any)
          .update({ materials_translated_zh: materialsZh })
          .eq('id', supplierRequest.id);
      }
    } catch (error) {
      console.error('Error translating to Chinese:', error);
      materialsZh = supplierRequest.materials_data;
    }
  }

  return NextResponse.json({
    isNewSystem: false,
    request: {
      ...supplierRequest,
      project_name: project?.name || 'Construction Project',
      materials_translated_en: materialsEn,
      materials_translated_zh: materialsZh,
    },
    existingQuote,
  });
}

// POST - Save or submit quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { token } = await params;
    const body = await request.json();
    const { supplierInfo, materials, currency, notes, status, isNewSystem, tokenId } = body;

    // New system: update supplier_tokens directly
    if (isNewSystem && tokenId) {
      return handleNewSystemPost(supabase, tokenId, body);
    }

    // Legacy system: use supplier_quotes table
    const { data: supplierRequest, error: requestError } = await supabase
      .from('supplier_requests' as any)
      .select('id')
      .eq('public_token', token)
      .single();

    if (requestError || !supplierRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Calculate total quote amount
    const totalQuoteAmount = materials.reduce((sum: number, m: any) => {
      const total = parseFloat(m.totalPrice) || 0;
      return sum + total;
    }, 0);

    // Check for existing draft
    const { data: existingQuote } = await supabase
      .from('supplier_quotes' as any)
      .select('id')
      .eq('supplier_request_id', supplierRequest.id)
      .eq('supplier_email', supplierInfo.email)
      .single();

    let result;

    if (existingQuote) {
      // Update existing quote
      const { data, error } = await supabase
        .from('supplier_quotes' as any)
        .update({
          supplier_name: supplierInfo.contactName,
          supplier_company: supplierInfo.companyName,
          supplier_country: supplierInfo.country,
          quoted_materials: materials,
          total_quote_amount: totalQuoteAmount,
          currency,
          notes,
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
        })
        .eq('id', existingQuote.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new quote
      const { data, error } = await supabase
        .from('supplier_quotes' as any)
        .insert({
          supplier_request_id: supplierRequest.id,
          supplier_name: supplierInfo.contactName,
          supplier_email: supplierInfo.email,
          supplier_company: supplierInfo.companyName,
          supplier_country: supplierInfo.country,
          quoted_materials: materials,
          total_quote_amount: totalQuoteAmount,
          currency,
          notes,
          status,
          ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update supplier request status if submitted
    if (status === 'submitted') {
      await supabase
        .from('supplier_requests' as any)
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierRequest.id);
    }

    return NextResponse.json({
      quote: result,
      message: status === 'submitted' ? 'Quote submitted successfully' : 'Draft saved',
    });
  } catch (error) {
    console.error('Error saving quote:', error);
    return NextResponse.json(
      { error: 'Failed to save quote' },
      { status: 500 }
    );
  }
}

// Handle POST for new supplier_tokens system
async function handleNewSystemPost(supabase: any, tokenId: string, body: any) {
  const { supplierInfo, materials, status } = body;

  // Update supplier token with info and quoted materials
  const updateData: any = {
    supplier_name: supplierInfo?.contactName || supplierInfo?.name,
    supplier_email: supplierInfo?.email,
    supplier_company: supplierInfo?.companyName || supplierInfo?.company,
    supplier_country: supplierInfo?.country,
    supplier_phone: supplierInfo?.phone,
    supplier_whatsapp: supplierInfo?.whatsapp,
    supplier_wechat: supplierInfo?.wechat,
    quoted_materials: materials,
    status: status === 'submitted' ? 'submitted' : 'in_progress',
  };

  if (status === 'submitted') {
    updateData.submitted_at = new Date().toISOString();
  }

  // Clear pending updates flag when supplier saves
  updateData.has_pending_updates = false;
  updateData.pending_updates = [];

  const { data, error } = await supabase
    .from('supplier_tokens' as any)
    .update(updateData)
    .eq('id', tokenId)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier token:', error);
    return NextResponse.json(
      { error: 'Failed to save' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: status === 'submitted' ? 'Cotation soumise avec succès' : 'Brouillon enregistré',
    data,
  });
}
