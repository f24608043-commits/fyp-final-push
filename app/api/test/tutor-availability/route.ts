import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tutorAvailability } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Missing tutorId parameter' },
        { status: 400 }
      );
    }

    // Skip auth check for testing purposes
    // In production, this should be protected

    // Query tutor_availability
    const availability = await db
      .select()
      .from(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, tutorId))
      .limit(1);

    return NextResponse.json({
      success: true,
      availability: availability[0] || null,
      count: availability.length
    });
  } catch (error) {
    console.error('Error querying tutor_availability:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
