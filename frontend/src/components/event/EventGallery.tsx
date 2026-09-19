'use client';

import { useState } from 'react';
import { ImageIcon, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useEventPhotos, useAddEventPhoto } from '@/hooks/useEvents';
import type { EventPhotoEntry } from '@/types/event';
import { formatDateTime } from '@/lib/utils';

export interface EventGalleryProps {
  eventId: string;
  canAdd?: boolean;
}

export function EventGallery({ eventId, canAdd = true }: EventGalleryProps) {
  const photosQuery = useEventPhotos(eventId);
  const addPhoto = useAddEventPhoto();
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');

  const items: EventPhotoEntry[] = photosQuery.data?.photos ?? [];

  const handleAdd = async () => {
    if (!photoUrl.trim()) {
      showToast.error('Vui lòng nhập URL ảnh');
      return;
    }
    try {
      await addPhoto.mutateAsync({
        eventId,
        payload: { photoUrl: photoUrl.trim(), caption: caption.trim() || undefined },
      });
      showToast.success('Đã thêm ảnh vào sự kiện');
      setPhotoUrl('');
      setCaption('');
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể thêm ảnh';
      showToast.error('Thêm ảnh thất bại', { description: message });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Khoảnh khắc ({items.length})
        </h3>
        {canAdd && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            Thêm ảnh
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card padding="lg" className="text-center text-neutral-500">
          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
          Chưa có khoảnh khắc nào được chia sẻ.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(({ photo, uploader }) => (
            <figure
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.photoUrl}
                alt={photo.caption ?? ''}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              />
              {(photo.caption || uploader?.fullName) && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                  {photo.caption && (
                    <span className="line-clamp-2 block">{photo.caption}</span>
                  )}
                  {uploader?.fullName && (
                    <span className="mt-1 text-[10px] opacity-80">
                      {uploader.fullName} · {formatDateTime(photo.uploadedAt)}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm ảnh sự kiện"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleAdd} loading={addPhoto.isPending}>
              Thêm ảnh
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="URL ảnh"
            placeholder="https://..."
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <Textarea
            label="Mô tả (tuỳ chọn)"
            placeholder="Chú thích cho khoảnh khắc..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}

export default EventGallery;