import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get user from custom users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at, role_id')
      .eq('id', params.id)
      .single();

    if (error || !user) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user info
    return NextResponse.json({
      id: user.id,
      email: user.email || '',
      full_name: user.full_name || 'Utilisateur',
      created_at: user.created_at,
      role_id: user.role_id,
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
    console.log('PATCH /api/admin/users/[id] - Request:', { userId: params.id, body });
    
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

    // Get current user to preserve existing metadata
    const { data: { user: currentUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(params.id);
    
    if (getUserError) {
      console.error('Error getting user:', getUserError);
      throw getUserError;
    }
    
    if (!currentUser) {
      console.error('User not found:', params.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Current user metadata:', currentUser.user_metadata);

    const currentMetadata = currentUser.user_metadata || {};

    // Build updated metadata
    const updatedMetadata = { ...currentMetadata };

    if (body.role !== undefined) {
      updatedMetadata.role = body.role;
    }

    if (body.is_active !== undefined) {
      updatedMetadata.is_active = body.is_active;
    }

    console.log('Updated metadata:', updatedMetadata);

    // Update user with merged metadata
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      {
        user_metadata: updatedMetadata
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    console.log('Update successful:', updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: error?.message || 'Unknown error'
      },
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
