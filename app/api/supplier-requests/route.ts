import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, numSuppliers, expiresInDays } = await request.json();

    if (!projectId || !numSuppliers) {
      return NextResponse.json(
        { error: 'Project ID and number of suppliers are required' },
        { status: 400 }
      );
    }

    // Get project materials
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)
      .order('category', { ascending: true });

    if (materialsError) {
      return NextResponse.json(
        { error: 'Failed to fetch materials' },
        { status: 500 }
      );
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: 'No materials found for this project' },
        { status: 400 }
      );
    }

    // Translate materials to English and Chinese
    const translateResponse = await fetch(`${request.nextUrl.origin}/api/translate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materials: materials.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          unit: m.unit,
          quantity: m.quantity,
        })),
        targetLanguage: 'en',
      }),
    });

    const { translations: translationsEn } = await translateResponse.json();

    const translateResponseZh = await fetch(`${request.nextUrl.origin}/api/translate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materials: materials.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          unit: m.unit,
          quantity: m.quantity,
        })),
        targetLanguage: 'zh',
      }),
    });

    const { translations: translationsZh } = await translateResponseZh.json();

    // Generate unique token for public access
    const publicToken = nanoid(32);
    
    // Calculate expiration date
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Generate request number
    const { data: requestNumberData } = await supabase.rpc('generate_request_number');
    const requestNumber = requestNumberData || `SR-${Date.now()}`;

    // Create supplier request
    const { data: supplierRequest, error: createError } = await supabase
      .from('supplier_requests')
      .insert({
        project_id: projectId,
        user_id: user.id,
        request_number: requestNumber,
        num_suppliers: numSuppliers,
        materials_data: materials,
        materials_translated_en: translationsEn,
        materials_translated_zh: translationsZh,
        total_materials: materials.length,
        public_token: publicToken,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Create supplier request error:', createError);
      return NextResponse.json(
        { error: 'Failed to create supplier request' },
        { status: 500 }
      );
    }

    // Generate public URL
    const publicUrl = `${request.nextUrl.origin}/supplier-quote/${publicToken}`;

    return NextResponse.json({
      supplierRequest,
      publicUrl,
      requestNumber,
    });
  } catch (error) {
    console.error('Supplier request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List user's supplier requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = supabase
      .from('supplier_requests')
      .select(`
        *,
        projects:project_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch supplier requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ supplierRequests: data });
  } catch (error) {
    console.error('Get supplier requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
