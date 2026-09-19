'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useSendMessage } from '@/hooks/useChat';
import type { SendMessageRequest } from '@/types/chat';

export interface SendMessageFormProps {
  chatId: string;
}

interface FormValues {
  content: string;
  attachmentUrl: string;
}

export function SendMessageForm({ chatId }: SendMessageFormProps) {
  const send = useSendMessage();
  const [includeAttachment, setIncludeAttachment] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { content: '', attachmentUrl: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!values.content.trim()) return;
    const payload: SendMessageRequest = {
      content: values.content.trim(),
      messageType: includeAttachment && values.attachmentUrl ? 'IMAGE' : 'TEXT',
      attachmentUrl: includeAttachment ? values.attachmentUrl.trim() || undefined : undefined,
    };
    try {
      await send.mutateAsync({ chatId, payload });
      reset({ content: '', attachmentUrl: '' });
      setIncludeAttachment(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể gửi tin nhắn';
      showToast.error('Gửi thất bại', { description: message });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2 border-t border-neutral-200 bg-white px-3 py-3"
    >
      {includeAttachment && (
        <Input
          label="URL đính kèm"
          placeholder="https://..."
          {...register('attachmentUrl')}
        />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIncludeAttachment((v) => !v)}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
          aria-label="Đính kèm"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('content')}
        />
        <Button
          type="submit"
          size="sm"
          loading={send.isPending}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Gửi
        </Button>
      </div>
    </form>
  );
}

export default SendMessageForm;