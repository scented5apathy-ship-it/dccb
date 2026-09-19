'use client';

import { Card } from '@/components/ui/Card';
import type { StoryMedia, StoryMediaType } from '@/types/story';

export interface StoryContentProps {
  content: string;
  media?: StoryMedia[];
}

/**
 * Render the story body. Supports light markdown:
 *  - blank lines separate paragraphs
 *  - **bold** renders as <strong>
 *  - *italic* renders as <em>
 *  - lines starting with "> " render as blockquotes
 *  - "# ", "## ", "### " render as headings
 * No external markdown library is used - keeps the bundle small.
 */
export function StoryContent({ content, media }: StoryContentProps) {
  const blocks = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <article className="prose prose-neutral max-w-none font-serif text-base leading-relaxed text-neutral-800">
          {blocks.map((b, i) => renderBlock(b, i))}
        </article>
      </Card>
      {media && media.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-neutral-900">Thư viện media</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m, idx) => (
              <MediaCard key={m.id ?? idx} media={m} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function renderBlock(block: string, key: number) {
  if (block.startsWith('### ')) {
    return (
      <h3 key={key} className="text-lg font-semibold">
        {inline(block.slice(4))}
      </h3>
    );
  }
  if (block.startsWith('## ')) {
    return (
      <h2 key={key} className="text-xl font-semibold">
        {inline(block.slice(3))}
      </h2>
    );
  }
  if (block.startsWith('# ')) {
    return (
      <h1 key={key} className="text-2xl font-bold">
        {inline(block.slice(2))}
      </h1>
    );
  }
  if (block.startsWith('> ')) {
    return (
      <blockquote
        key={key}
        className="border-l-4 border-primary-300 bg-primary-50/40 px-4 py-2 italic text-neutral-700"
      >
        {inline(block.slice(2))}
      </blockquote>
    );
  }
  return (
    <p key={key} className="text-base leading-relaxed">
      {inline(block)}
    </p>
  );
}

function inline(text: string): React.ReactNode {
  // Convert **bold** and *italic* to <strong>/<em>. Done naively but good enough.
  const parts: React.ReactNode[] = [];
  let i = 0;
  let buffer = '';
  const flush = () => {
    if (buffer) {
      parts.push(buffer);
      buffer = '';
    }
  };
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > -1) {
        flush();
        parts.push(<strong key={`b-${i}`}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end > -1) {
        flush();
        parts.push(<em key={`i-${i}`}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }
  flush();
  return parts;
}

function MediaCard({ media }: { media: StoryMedia }) {
  const type = (media.mediaType ?? media.type ?? 'image') as StoryMediaType;
  const url = media.mediaUrl ?? media.url;
  const caption = media.caption;

  if (type === 'video' || type === 'VIDEO') {
    return (
      <figure className="overflow-hidden rounded-lg bg-neutral-100">
        <video src={url} controls className="aspect-video w-full object-cover" />
        {caption && (
          <figcaption className="p-2 text-xs text-neutral-600">{caption}</figcaption>
        )}
      </figure>
    );
  }

  if (type === 'audio' || type === 'AUDIO') {
    return (
      <figure className="rounded-lg bg-neutral-50 p-3">
        <audio src={url} controls className="w-full" />
        {caption && (
          <figcaption className="mt-2 text-xs text-neutral-600">{caption}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={caption ?? 'media'}
        className="aspect-video w-full object-cover"
      />
      {caption && (
        <figcaption className="p-2 text-xs text-neutral-600">{caption}</figcaption>
      )}
    </figure>
  );
}

export default StoryContent;