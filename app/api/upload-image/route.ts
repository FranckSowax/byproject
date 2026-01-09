import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Utiliser le service role key pour contourner RLS
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing Supabase config:', { url: !!url, key: !!key });
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const bucket = formData.get('bucket') as string || 'project-images';

    console.log('Upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      userId,
      bucket
    });

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId || userId === 'anonymous') {
      return NextResponse.json(
        { error: 'User must be authenticated to upload images' },
        { status: 401 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/images/${timestamp}.${fileExt}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage avec service role key (bypass RLS)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', {
        message: error.message,
        name: error.name,
        bucket,
        fileName
      });
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Upload success:', { fileName, bucket });

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      path: fileName,
      publicUrl
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
