'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';
import { StoryHero } from '@/components/story/StoryHero';
import { StoryContent } from '@/components/story/StoryContent';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteStory, useStory } from '@/hooks/useStories';

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id;
  const { data: story, isLoading, error } = useStory(storyId);
  const deleteStory = useDeleteStory();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" label="Đang tải câu chuyện…" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="space-y-3">
        <Link href="/stories" className="text-sm text-primary-600 hover:text-primary-800">
          ← Quay lại danh sách
        </Link>
        <Card padding="lg">
          <p className="text-sm text-neutral-600">
            Không tìm thấy câu chuyện hoặc bạn không có quyền truy cập.
          </p>
        </Card>
      </div>
    );
  }

  const isAuthor = story.story.authorId === user?.id;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  const onDelete = async () => {
    try {
      await deleteStory.mutateAsync(storyId);
      showToast.success('Đã xoá câu chuyện');
      router.push('/stories');
    } catch (e) {
      showToast.error('Không thể xoá', {
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/stories"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách câu chuyện
      </Link>

      <StoryHero story={story.story} author={story.author ?? null} />

      {canEdit && (
        <div className="flex justify-end gap-2">
          <Link href={`/stories/${storyId}/edit`}>
            <Button variant="outline">Chỉnh sửa</Button>
          </Link>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Xoá
          </Button>
        </div>
      )}

      <StoryContent content={story.story.content} media={story.media} />

      {/* Related members placeholder */}
      {story.story.relatedMemberIds && story.story.relatedMemberIds.length > 0 && (
        <Card padding="md">
          <h3 className="font-serif text-base font-semibold text-neutral-900">
            Thành viên liên quan
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {story.story.relatedMemberIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/members/${id}`}
                  className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                >
                  Thành viên {id.slice(0, 6)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Comments placeholder */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-neutral-900">
          <MessageCircle className="mr-1.5 inline h-4 w-4" />
          Bình luận ({story.comments?.length ?? 0})
        </h3>
        {story.comments && story.comments.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {story.comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
              >
                <p className="text-xs font-semibold text-neutral-700">
                  {c.userName ?? 'Thành viên'}
                </p>
                <p className="mt-1 text-sm text-neutral-800">{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Chưa có bình luận nào.
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá câu chuyện"
        description="Hành động này không thể hoàn tác."
        confirmText="Xoá"
        variant="danger"
        loading={deleteStory.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </div>
  );
}