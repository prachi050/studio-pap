export type AssistantRole = 'user' | 'assistant';

export type AssistantSavedMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  imageName?: string;
  imagePreviewUrl?: string;
};

export type AssistantSavedChat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantSavedMessage[];
};

const STORAGE_KEY = 'studio-pap-assistant-chats';

export function getAssistantChats(): AssistantSavedChat[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as AssistantSavedChat[];
  } catch {
    return [];
  }
}

export function saveAssistantChats(chats: AssistantSavedChat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function createAssistantChat(): AssistantSavedChat {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "Welcome back. I’ve loaded your latest design analysis, so we can jump straight into improving your interface.\n\nAsk me anything about the score, accessibility, typography, hierarchy, spacing, color, or how to make the design feel more premium.",
      },
    ],
  };
}

export function getChatTitle(messages: AssistantSavedMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');

  if (!firstUserMessage) return 'New chat';

  return firstUserMessage.content.slice(0, 42);
}

export function upsertAssistantChat(chat: AssistantSavedChat) {
  const chats = getAssistantChats();
  const existingIndex = chats.findIndex((item) => item.id === chat.id);

  const updatedChat = {
    ...chat,
    title: getChatTitle(chat.messages),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    chats[existingIndex] = updatedChat;
  } else {
    chats.unshift(updatedChat);
  }

  saveAssistantChats(chats);
}

export function deleteAssistantChat(chatId: string) {
  const chats = getAssistantChats().filter((chat) => chat.id !== chatId);
  saveAssistantChats(chats);
}