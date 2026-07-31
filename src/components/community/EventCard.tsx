import { CalendarDays, Clock, MapPin, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactionBar } from "./ReactionBar";
import { AuthorChip } from "./AuthorChip";
import { formatBanglaDate } from "@/lib/bangla";
import {
  EVENT_CATEGORY_ICON,
  EVENT_CATEGORY_LABEL_BN,
  type CommunityEventRow,
  type CommunityPublicProfile,
} from "@/lib/community-shared";

export function EventCard({
  e,
  organizer,
}: {
  e: CommunityEventRow;
  organizer?: CommunityPublicProfile;
}) {
  return (
    <Card className="overflow-hidden">
      {e.cover_url ? (
        <img src={e.cover_url} alt={e.title} loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div className="grid h-24 w-full place-items-center bg-gradient-to-br from-primary/15 to-emerald-500/15 text-4xl">
          {EVENT_CATEGORY_ICON[e.category]}
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {EVENT_CATEGORY_ICON[e.category]} {EVENT_CATEGORY_LABEL_BN[e.category]}
          </Badge>
          {e.visibility === "members" ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Lock className="h-3 w-3" /> শুধু সদস্য
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-2 text-base font-bold">{e.title}</h3>
        {e.description ? <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.description}</p> : null}

        <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {formatBanglaDate(e.event_date)}
          </span>
          {e.event_time ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {e.event_time}
            </span>
          ) : null}
          {e.area ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {e.area}
            </span>
          ) : null}
        </div>

        <div className="mt-3 border-t pt-3">
          <AuthorChip profile={organizer} userId={e.organizer_id} subtitle="আয়োজক" />
        </div>

        <ReactionBar
          className="mt-2"
          targetType="event"
          targetId={e.id}
          likeCount={e.like_count}
          shareTitle={e.title}
          sharePath="/community/events"
        />
      </div>
    </Card>
  );
}
