import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated as admin
    // (You may want to add proper admin authentication here)
    
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

    // Get user by ID using admin API
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(params.id);

    if (error || !user) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return only necessary user info
    return NextResponse.json({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Utilisateur',
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
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

    // Update user role in metadata
    if (body.role) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        params.id,
        {
          user_metadata: { role: body.role }
        }
      );

      if (error) throw error;
    }

    // Toggle user active status (ban/unban)
    if (body.is_active !== undefined) {
      if (body.is_active) {
        // Unban user
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          params.id,
          {
            ban_duration: 'none'
          }
        );
        if (error) throw error;
      } else {
        // Ban user indefinitely
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          params.id,
          {
            ban_duration: '876000h' // 100 years
          }
        );
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
