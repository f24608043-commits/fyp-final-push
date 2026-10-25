import { getFeed } from "./actions";
import FeedListClient from "./FeedListClient";

export default async function FeedList() {
  const result = await getFeed(undefined, 20);

  return (
    <FeedListClient
      initialPosts={result.posts}
      nextCursor={result.nextCursor}
    />
  );
}
