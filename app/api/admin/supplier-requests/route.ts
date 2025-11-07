import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: requests, error } = await supabase
      .from('supplier_requests')
      .select(`
        *,
        projects:project_id (
          id,
          name
        ),
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: requests });
  } catch (error: any) {
    console.error('Error in supplier-requests API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
