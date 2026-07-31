import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactionBar } from "./ReactionBar";
import { AuthorChip } from "./AuthorChip";
import type { CommunityPostRow, CommunityPublicProfile, CommunityRow } from "@/lib/community-shared";
import { communityPath } from "@/lib/community-shared";

export function PostCard({
  p,
  author,
  community,
}: {
  p: CommunityPostRow;
  author?: CommunityPublicProfile;
  community?: CommunityRow;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <AuthorChip profile={author} userId={p.author_id} createdAt={p.created_at} />
        {community ? (
          <Link to="/community/c/$slug" params={{ slug: communityPath(community) }}>
            <Badge variant="secondary" className="max-w-[10rem] truncate text-[10px]">
              {community.name}
            </Badge>
          </Link>
        ) : null}
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{p.content}</p>

      {p.image_url ? (
        <img
          src={p.image_url}
          alt="পোস্টের ছবি"
          loading="lazy"
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
        />
      ) : null}

      <ReactionBar
        className="mt-2"
        targetType="post"
        targetId={p.id}
        likeCount={p.like_count}
        shareTitle={p.content.slice(0, 60)}
        sharePath="/community/feed"
      />
    </Card>
  );
}
