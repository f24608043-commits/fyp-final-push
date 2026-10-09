import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUnreadCount } from "@/app/notifications/actions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const count = await getUnreadCount();
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    return NextResponse.json({ unreadCount: 0 });
  }
}
