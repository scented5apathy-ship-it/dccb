import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { Story } from '@/types/story';

export interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link href={`/stories/${story.id}`} className="block">
      <Card hoverable padding="md">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">
            {story.title}
          </h3>
          {story.tags && story.tags.length > 0 && (
            <Badge variant="info" size="sm">
              {story.tags[0]?.name}
            </Badge>
          )}
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
          {truncate(story.excerpt ?? story.content, 200)}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          <span>{story.authorName ?? '—'}</span>
          <span>{formatRelativeTime(story.createdAt)}</span>
        </div>
      </Card>
    </Link>
  );
}

export default StoryCard;