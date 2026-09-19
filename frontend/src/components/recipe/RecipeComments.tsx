'use client';

import { useState } from 'react';
import { MessageSquare, Reply, Edit2, Trash2, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';
import { formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddComment,
  useDeleteComment,
  useRecipeComments,
  useUpdateComment,
} from '@/hooks/useRecipeInteractions';
import type { RecipeComment, RecipeThreadComment } from '@/types/recipe';

export interface RecipeCommentsProps {
  recipeId: string;
}

interface NormalizedComment {
  id: string;
  content: string;
  createdAt?: string;
  userId?: string;
  user?: { id?: string; fullName?: string; avatarUrl?: string };
  replies: NormalizedComment[];
}

function normalize(node: RecipeThreadComment): NormalizedComment {
  // Backend may return CommentThread { comment, replies } OR a plain CommentDto.
  const obj = node as unknown as Record<string, unknown>;
  if ('comment' in obj && obj.comment) {
    const c = obj.comment as RecipeComment;
    const replies = (node as { replies?: RecipeThreadComment[] }).replies ?? [];
    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      userId: c.userId,
      user: c.user,
      replies: (replies as RecipeThreadComment[]).map(normalize),
    };
  }
  const c = node as RecipeComment;
  const replies = (c as unknown as { replies?: RecipeThreadComment[] }).replies ?? [];
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    userId: c.userId,
    user: c.user,
    replies: replies.map(normalize),
  };
}

export function RecipeComments({ recipeId }: RecipeCommentsProps) {
  const { user } = useAuth();
  const { data: threads, isLoading } = useRecipeComments(recipeId);
  const addComment = useAddComment();
  const [newContent, setNewContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const comments = (threads ?? []).map(normalize);

  const total = countAll(comments);

  const handleSubmit = async (parentId?: string) => {
    const content = parentId ? '' : newContent.trim();
    const replyContent = parentId ? newContent.trim() : '';
    const text = parentId ? replyContent : content;
    if (!text) return;

    try {
      await addComment.mutateAsync({
        recipeId,
        payload: {
          content: text,
          ...(parentId ? { parentCommentId: parentId } : {}),
        },
      });
      if (!parentId) setNewContent('');
      setReplyTo(null);
      showToast.success('Đã đăng bình luận');
    } catch (e) {
      showToast.error('Không thể đăng bình luận', { description: errMsg(e) });
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          <MessageSquare className="mr-1.5 inline h-4 w-4" />
          Bình luận
          <span className="ml-2 text-xs font-normal text-neutral-500">{total}</span>
        </h3>
      </div>

      {/* Compose box */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex gap-3">
          <Avatar name={user?.fullName ?? '?'} src={user?.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              placeholder="Chia sẻ cảm nhận hoặc kinh nghiệm của bạn…"
              className="block w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => handleSubmit()}
                loading={addComment.isPending}
                disabled={!newContent.trim()}
                leftIcon={<Send className="h-3.5 w-3.5" />}
              >
                Bình luận
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-neutral-500">Đang tải bình luận…</p>
      )}

      <ul className="mt-4 space-y-4">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            recipeId={recipeId}
            currentUserId={user?.id}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            editId={editId}
            setEditId={setEditId}
          />
        ))}
        {!isLoading && comments.length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
            Hãy là người đầu tiên bình luận về công thức này.
          </li>
        )}
      </ul>
    </Card>
  );
}

function countAll(comments: NormalizedComment[]): number {
  return comments.reduce(
    (acc, c) => acc + 1 + countAll(c.replies),
    0
  );
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return '';
}

interface CommentRowProps {
  comment: NormalizedComment;
  recipeId: string;
  currentUserId?: string;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
}

function CommentRow({
  comment,
  recipeId,
  currentUserId,
  replyTo,
  setReplyTo,
  editId,
  setEditId,
}: CommentRowProps) {
  const isMine = comment.user?.id === currentUserId;
  const [draft, setDraft] = useState(comment.content);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const addReplyMutation = useAddComment();

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await addReplyMutation.mutateAsync({
        recipeId,
        payload: {
          content: replyText.trim(),
          parentCommentId: comment.id,
        },
      });
      setReplyText('');
      setReplyTo(null);
      showToast.success('Đã gửi trả lời');
    } catch (e) {
      showToast.error('Không thể trả lời', { description: errMsg(e) });
    }
  };

  const startEdit = () => {
    setEditId(comment.id);
    setDraft(comment.content);
  };

  const saveEdit = async () => {
    if (!draft.trim()) return;
    try {
      await updateComment.mutateAsync({
        commentId: comment.id,
        recipeId,
        payload: { content: draft.trim() },
      });
      setEditId(null);
      showToast.success('Đã cập nhật bình luận');
    } catch (e) {
      showToast.error('Không thể cập nhật', { description: errMsg(e) });
    }
  };

  const doDelete = async () => {
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, recipeId });
      setConfirmDelete(false);
      showToast.success('Đã xoá bình luận');
    } catch (e) {
      showToast.error('Không thể xoá', { description: errMsg(e) });
    }
  };

  return (
    <li className="rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex gap-3">
        <Avatar
          name={comment.user?.fullName ?? '?'}
          src={comment.user?.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-900">
              {comment.user?.fullName ?? 'Thành viên'}
            </span>
            <span className="text-xs text-neutral-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          {editId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="block w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                  Huỷ
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdit}
                  loading={updateComment.isPending}
                >
                  Lưu
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
              {comment.content}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800"
            >
              <Reply className="h-3 w-3" /> Trả lời
            </button>
            {isMine && editId !== comment.id && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800"
                >
                  <Edit2 className="h-3 w-3" /> Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" /> Xoá
                </button>
              </>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder={`Trả lời ${comment.user?.fullName ?? ''}…`}
                className="block w-full resize-y rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                  Huỷ
                </Button>
                <Button
                  size="sm"
                  onClick={submitReply}
                  loading={addReplyMutation.isPending}
                >
                  Gửi
                </Button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-3 border-l-2 border-neutral-100 pl-4">
              {comment.replies.map((rep) => (
                <CommentRow
                  key={rep.id}
                  comment={rep}
                  recipeId={recipeId}
                  currentUserId={currentUserId}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  editId={editId}
                  setEditId={setEditId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá bình luận"
        description="Hành động này không thể hoàn tác."
        confirmText="Xoá"
        variant="danger"
        loading={deleteComment.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={doDelete}
      />
    </li>
  );
}

export default RecipeComments;