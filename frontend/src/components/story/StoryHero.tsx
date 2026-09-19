'use client';

import { Calendar, MapPin, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { Story } from '@/types/story';

export interface StoryHeroProps {
  story: Story;
  author?: { id?: string; fullName?: string; avatarUrl?: string } | null;
}

export function StoryHero({ story, author }: StoryHeroProps) {
  return (
    <header className="overflow-hidden rounded-2xl bg-white shadow-soft">
      {story.coverImageUrl && (
        <div className="aspect-[21/9] w-full bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {story.isFeatured && (
            <Badge variant="warning" size="md">
              <Star className="h-3 w-3" /> Nổi bật
            </Badge>
          )}
          {story.tags?.map((t) => (
            <Badge key={t.id} variant="primary" size="md">
              #{t.name}
            </Badge>
          ))}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">
          {story.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Avatar
              name={author?.fullName ?? '?'}
              src={author?.avatarUrl}
              size="xs"
            />
            <span className="font-medium text-neutral-800">
              {author?.fullName ?? 'Tác giả'}
            </span>
          </div>
          {story.storyDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary-600" />
              {formatDate(story.storyDate)}
            </span>
          )}
          {story.storyLocation && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary-600" />
              {story.storyLocation}
            </span>
          )}
          {story.createdAt && (
            <span className="text-xs text-neutral-500">
              Đăng {formatRelativeTime(story.createdAt)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export default StoryHero;