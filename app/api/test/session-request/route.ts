import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessionRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const learnerId = searchParams.get('learnerId');
    const tutorId = searchParams.get('tutorId');

    if (!learnerId || !tutorId) {
      return NextResponse.json(
        { error: 'Missing learnerId or tutorId parameter' },
        { status: 400 }
      );
    }

    // Skip auth check for testing purposes
    // In production, this should be protected

    // Query session_requests
    const sessionRequest = await db
      .select()
      .from(sessionRequests)
      .where(
        and(
          eq(sessionRequests.learnerId, learnerId),
          eq(sessionRequests.tutorId, tutorId)
        )
      )
      .orderBy(sessionRequests.createdAt)
      .limit(1);

    return NextResponse.json({
      success: true,
      sessionRequest: sessionRequest[0] || null,
      count: sessionRequest.length
    });
  } catch (error) {
    console.error('Error querying session_requests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
