// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET - Load supplier request by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { token } = await params;

    // Get supplier request with public token - using service role to bypass RLS
    const { data: supplierRequest, error } = await supabase
      .from('supplier_requests' as any)
      .select('*')
      .eq('public_token', token)
      .single();

    if (error) {
      console.error('Error fetching supplier request:', error);
      return NextResponse.json(
        { error: 'Request not found', details: error.message },
        { status: 404 }
      );
    }

    if (!supplierRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

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

    if (!materialsEn || materialsEn.length === 0) {
      // Translate to English on-demand
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
          
          // Update database with translations
          await supabase
            .from('supplier_requests' as any)
            .update({ materials_translated_en: materialsEn })
            .eq('id', supplierRequest.id);
        }
      } catch (error) {
        console.error('Error translating to English:', error);
        materialsEn = supplierRequest.materials_data; // Fallback to original
      }
    }

    if (!materialsZh || materialsZh.length === 0) {
      // Translate to Chinese on-demand
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
          
          // Update database with translations
          await supabase
            .from('supplier_requests' as any)
            .update({ materials_translated_zh: materialsZh })
            .eq('id', supplierRequest.id);
        }
      } catch (error) {
        console.error('Error translating to Chinese:', error);
        materialsZh = supplierRequest.materials_data; // Fallback to original
      }
    }

    return NextResponse.json({
      request: {
        ...supplierRequest,
        project_name: project?.name || 'Construction Project',
        materials_translated_en: materialsEn,
        materials_translated_zh: materialsZh,
      },
      existingQuote,
    });
  } catch (error) {
    console.error('Error loading supplier request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
    const { supplierInfo, materials, currency, notes, status } = body;

    // Get supplier request
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
