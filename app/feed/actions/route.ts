import { NextRequest, NextResponse } from 'next/server';
import { toggleLike, deletePost, addComment, getPostComments, getFeed } from '../actions';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = formData.get('action') as string;

  try {
    switch (action) {
      case 'toggleLike': {
        const postId = formData.get('postId') as string;
        const result = await toggleLike(postId);
        return NextResponse.json(result);
      }
      case 'deletePost': {
        const postId = formData.get('postId') as string;
        await deletePost(postId);
        return NextResponse.json({ success: true });
      }
      case 'addComment': {
        const postId = formData.get('postId') as string;
        const body = formData.get('body') as string;
        await addComment(postId, body);
        return NextResponse.json({ success: true });
      }
      case 'getPostComments': {
        const postId = formData.get('postId') as string;
        const result = await getPostComments(postId);
        return NextResponse.json(result);
      }
      case 'getFeed': {
        const cursor = formData.get('cursor') as string | null;
        const result = await getFeed(cursor || undefined, 20);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
