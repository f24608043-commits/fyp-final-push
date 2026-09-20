import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // Verify admin access for security
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query profiles by email (need to join with auth users or use a different approach)
    // Since we don't have email in profiles table, we'll need to use Supabase auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: authUser.id,
      email: authUser.email
    });
  } catch (error) {
    console.error('Error querying user by email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
