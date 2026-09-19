import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { Story } from '@/types/story';

export interface StoryTimelineProps {
  stories: Story[];
}

export function StoryTimeline({ stories }: StoryTimelineProps) {
  if (stories.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-neutral-500">Chưa có câu chuyện nào.</p>
      </Card>
    );
  }

  const sorted = [...stories].sort((a, b) => {
    const at = a.storyDate ?? a.createdAt ?? '';
    const bt = b.storyDate ?? b.createdAt ?? '';
    return bt.localeCompare(at);
  });

  return (
    <ol className="space-y-6">
      {sorted.map((story, idx) => (
        <li key={story.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-primary-500" />
            {idx < sorted.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-neutral-200" />
            )}
          </div>
          <Card padding="md" className="flex-1">
            <p className="text-xs text-neutral-500">
              {formatDate(story.storyDate ?? story.createdAt)}
            </p>
            <h3 className="mt-1 text-base font-semibold text-neutral-900">
              {story.title}
            </h3>
            {story.excerpt && (
              <p className="mt-2 text-sm text-neutral-600">{story.excerpt}</p>
            )}
          </Card>
        </li>
      ))}
    </ol>
  );
}

export default StoryTimeline;