import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { mascotChat, MascotChatParams } from "@/lib/ai/mascotChat";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 20 requests per minute per user
    const rateLimitResult = rateLimit(user.id, 20, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    const { message, context, simulateOpenAiFailure, simulateOpenRouterFailure } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Limit message length to prevent abuse
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const params: MascotChatParams = {
      userId: user.id,
      message,
      context: context || {},
      simulateOpenAiFailure: simulateOpenAiFailure || false,
      simulateOpenRouterFailure: simulateOpenRouterFailure || false,
    };

    const result = await mascotChat(params);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      }
    });
  } catch (error: any) {
    console.error("Mascot chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
