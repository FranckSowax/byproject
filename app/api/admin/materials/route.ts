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
    // Using service role key bypasses RLS
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
          supplier:suppliers(name)
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

    return NextResponse.json(materialsData);

  } catch (error: any) {
    console.error('Error in materials API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
