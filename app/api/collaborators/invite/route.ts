import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, projectId, projectName, role, inviterEmail } = await request.json();

    if (!email || !projectId || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://byproject-twinsk.netlify.app';
    
    // Lien différent selon si l'utilisateur existe ou non
    const inviteLink = existingUser 
      ? `${appUrl}/dashboard/projects/${projectId}?accept_invite=true`
      : `${appUrl}/auth/register?invite_project=${projectId}&email=${encodeURIComponent(email)}`;

    const roleLabel = role === 'editor' ? 'Éditeur' : 'Lecteur';

    // Envoyer l'email d'invitation
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: 'ByProject <noreply@byproject.app>',
          to: email,
          subject: `Invitation à collaborer sur "${projectName}"`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9ff;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #5B5FC7 0%, #7B7FE8 50%, #FF9B7B 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Invitation à collaborer</h1>
                </div>
                
                <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(91, 95, 199, 0.1);">
                  <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">
                    Bonjour,
                  </p>
                  
                  <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">
                    <strong>${inviterEmail}</strong> vous invite à collaborer sur le projet :
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #F5F6FF 0%, #E8EEFF 100%); border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #5B5FC7;">
                    <h2 style="color: #5B5FC7; margin: 0 0 8px 0; font-size: 20px;">${projectName}</h2>
                    <p style="color: #718096; margin: 0; font-size: 14px;">
                      Rôle attribué : <strong style="color: ${role === 'editor' ? '#48BB78' : '#4299E1'};">${roleLabel}</strong>
                    </p>
                  </div>
                  
                  <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">
                    ${existingUser 
                      ? 'Cliquez sur le bouton ci-dessous pour accéder au projet :' 
                      : 'Créez votre compte gratuit pour accéder au projet :'}
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #5B5FC7 0%, #7B7FE8 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(91, 95, 199, 0.3);">
                      ${existingUser ? '📂 Accéder au projet' : '🚀 Créer mon compte'}
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #E0E4FF; margin: 32px 0;">
                  
                  <p style="color: #A0AEC0; font-size: 12px; text-align: center;">
                    Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
                  </p>
                </div>
                
                <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin-top: 24px;">
                  © ${new Date().getFullYear()} ByProject - Gestion de projets BTP
                </p>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`✅ Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Ne pas échouer si l'email ne part pas
      }
    }

    // Créer une notification pour l'utilisateur invité (s'il existe)
    if (existingUser) {
      await supabase.from('notifications').insert({
        user_id: existingUser.id,
        type: 'collaboration_invite',
        title: 'Nouvelle invitation',
        message: `Vous avez été invité à collaborer sur "${projectName}"`,
        data: { projectId, projectName, role },
        link: `/dashboard/projects/${projectId}`,
        icon: 'users',
        color: 'blue',
      });
    }

    return NextResponse.json({ 
      success: true,
      userExists: !!existingUser,
    });

  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
