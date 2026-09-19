'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Placeholder edit page - currently redirects to detail.
 * Full editing UI can be wired in later by mounting a story form prefilled
 * with the existing story data and calling storyApi.update() on save.
 */
export default function EditStoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/stories/${params.id}`);
    }
  }, [params, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">
      Đang chuyển hướng đến trang chi tiết…
    </div>
  );
}