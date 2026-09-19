export interface FamilyChat {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ChatLastMessage {
  id?: string;
  chatId?: string;
  senderId?: string;
  content?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
  createdAt?: string;
}

export interface ChatEntry {
  chat: FamilyChat;
  memberCount: number;
  lastMessage?: ChatLastMessage | null;
  unreadCount: number;
}

export interface ChatListResponse {
  chats: ChatEntry[];
}

export interface CreateChatRequest {
  familyId: string;
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachmentUrl?: string;
  replyToMessageId?: string;
  createdAt?: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface MessageEntry {
  message: ChatMessage;
  sender?: { id?: string; fullName?: string; avatarUrl?: string } | null;
  replyTo?: ChatMessage | null;
}

export interface ChatMessageListResponse {
  messages: MessageEntry[];
}

export interface SendMessageRequest {
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachmentUrl?: string;
  replyToMessageId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  sender?: { id?: string; fullName?: string; avatarUrl?: string } | null;
  replyTo?: ChatMessage | null;
}