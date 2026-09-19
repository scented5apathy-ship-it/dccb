'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MessageCircle, Plus, Home } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChatList } from '@/components/chat/ChatList';
import { MessageList } from '@/components/chat/MessageList';
import { SendMessageForm } from '@/components/chat/SendMessageForm';
import { useAuth } from '@/hooks/useAuth';
import {
  useChats,
  useChatMessages,
  useCreateChat,
} from '@/hooks/useChat';
import { familyApi } from '@/lib/api-client';
import { showToast } from '@/components/ui/Toast';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>();

  const familiesQuery = useQuery({
    queryKey: ['families', 'list'],
    queryFn: () => familyApi.list(),
    enabled: Boolean(user),
  });
  const families = familiesQuery.data?.families ?? [];

  // Default to the first family but let the user switch via a dropdown.
  const familyId = selectedFamilyId ?? families[0]?.family?.id;

  const chatsQuery = useChats(familyId);
  const messagesQuery = useChatMessages(selectedChatId);
  const createChat = useCreateChat();

  const chats = chatsQuery.data?.chats ?? [];

  useEffect(() => {
    // Auto-select the first chat only when the user hasn't picked anything
    // AND the chat list just freshly changed (different first chat id).
    // We also reset whenever the family context changes so we don't keep
    // a chat from a different family selected.
    if (!selectedChatId || !chats.find((c) => c.chat.id === selectedChatId)) {
      if (chats[0]?.chat.id) {
        setSelectedChatId(chats[0].chat.id);
      }
    }
  }, [chats, selectedChatId]);

  const handleCreate = async () => {
    if (!familyId || !name.trim()) {
      showToast.error('Vui lòng nhập tên cuộc trò chuyện');
      return;
    }
    try {
      const res = await createChat.mutateAsync({
        familyId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      showToast.success('Đã tạo cuộc trò chuyện');
      const newId = (res?.chat as { id?: string })?.id;
      if (newId) setSelectedChatId(newId);
      setCreateOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo cuộc trò chuyện';
      showToast.error('Tạo thất bại', { description: message });
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
            <MessageCircle className="h-6 w-6 text-primary-600" />
            Trò chuyện
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Trò chuyện với các thành viên trong gia đình.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {families.length > 1 && (
            <select
              value={familyId ?? ''}
              onChange={(e) => {
                setSelectedFamilyId(e.target.value || undefined);
                setSelectedChatId(undefined);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              {families.map((f) => (
                <option key={f.family.id} value={f.family.id}>
                  {f.family.name}
                </option>
              ))}
            </select>
          )}
          {familyId ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Cuộc trò chuyện mới
            </Button>
          ) : (
            <Link href="/families/new">
              <Button leftIcon={<Home className="h-4 w-4" />} variant="outline">
                Tạo gia đình để bắt đầu
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card padding="sm" className="lg:max-h-[70vh] lg:overflow-y-auto">
          {chatsQuery.isLoading ? (
            <Spinner size="md" label="Đang tải..." />
          ) : (
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelect={(id) => setSelectedChatId(id)}
            />
          )}
        </Card>

        <Card padding="none" className="flex min-h-[60vh] flex-col">
          {!selectedChatId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<MessageCircle className="h-8 w-8" />}
                title="Chọn một cuộc trò chuyện"
                description="Hoặc tạo cuộc trò chuyện mới để bắt đầu."
              />
            </div>
          ) : (
            <>
              <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
                {chats.find((c) => c.chat.id === selectedChatId)?.chat.name ??
                  'Cuộc trò chuyện'}
              </div>
              {messagesQuery.isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Spinner size="md" label="Đang tải tin nhắn..." />
                </div>
              ) : (
                <MessageList
                  messages={messagesQuery.data?.messages ?? []}
                  currentUserId={user?.id}
                />
              )}
              <SendMessageForm chatId={selectedChatId} />
            </>
          )}
        </Card>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cuộc trò chuyện mới"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreate} loading={createChat.isPending}>
              Tạo
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tên cuộc trò chuyện"
            placeholder="VD: Gia đình nhà tổ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Mô tả (tuỳ chọn)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}