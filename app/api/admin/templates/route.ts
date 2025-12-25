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

    // Get all templates
    const { data: templates, error } = await supabaseAdmin
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Enrich with material counts
    // Note: Assuming there is a 'template_materials' table or similar. 
    // If not, we just return 0 or check if the table exists.
    // Based on the page.tsx TODO, it seems it might not be fully implemented or linked yet.
    // For now, we'll just return the templates.
    
    return NextResponse.json(templates);

  } catch (error: any) {
    console.error('Error in templates API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
