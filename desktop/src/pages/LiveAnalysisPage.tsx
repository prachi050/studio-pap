import {
  Bot,
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Send,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";

import { getAnalysisHistory } from "../services/analysisHistory";
import { askAssistant } from "../services/assistantChat";
import {
  createAssistantChat,
  deleteAssistantChat,
  getAssistantChats,
  type AssistantSavedChat,
  type AssistantSavedMessage,
  upsertAssistantChat,
} from "../services/assistantHistory";
import { generateVoiceSpeech } from "../services/voiceSpeech";
import {
  getVoiceSettings,
  type VoiceSettings,
} from "../services/voiceSettings";
import { transcribeVoice } from "../services/voiceTranscription";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not create the image preview."));
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}

function formatChatDate(value: string): string {
  const date = new Date(value);
  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getSupportedAudioMimeType(): string {
  const preferredTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return (
    preferredTypes.find((type) =>
      MediaRecorder.isTypeSupported(type),
    ) ?? ""
  );
}

export function LiveAnalysisPage() {
  const [savedChats, setSavedChats] =
    useState<AssistantSavedChat[]>([]);

  const [activeChatId, setActiveChatId] =
    useState("");

  const [messages, setMessages] =
    useState<AssistantSavedMessage[]>([]);

  const [message, setMessage] = useState("");

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [selectedImageDataUrl, setSelectedImageDataUrl] =
    useState<string | null>(null);

  const [isSending, setIsSending] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isTranscribing, setIsTranscribing] =
    useState(false);

  const [attachmentError, setAttachmentError] =
    useState("");

  const [voiceError, setVoiceError] =
    useState("");

  const [collapsedTranscriptIds, setCollapsedTranscriptIds] =
    useState<Set<string>>(() => new Set());

  const [speakingMessageIds, setSpeakingMessageIds] =
    useState<Set<string>>(() => new Set());

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const speechAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const speechAudioUrlRef =
    useRef<string | null>(null);

  useEffect(() => {
    const chats = getAssistantChats();

    if (chats.length > 0) {
      setSavedChats(chats);
      setActiveChatId(chats[0].id);
      setMessages(chats[0].messages);
      return;
    }

    const initialChat = createAssistantChat();

    upsertAssistantChat(initialChat);

    setSavedChats([initialChat]);
    setActiveChatId(initialChat.id);
    setMessages(initialChat.messages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending, isTranscribing, speakingMessageIds]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioChunksRef.current = [];

      speechAudioRef.current?.pause();
      speechAudioRef.current = null;

      if (speechAudioUrlRef.current) {
        URL.revokeObjectURL(
          speechAudioUrlRef.current,
        );
        speechAudioUrlRef.current = null;
      }
    };
  }, []);

  const speakAssistantReply = async (
    text: string,
    settings: VoiceSettings,
  ): Promise<void> => {
    try {
      speechAudioRef.current?.pause();
      speechAudioRef.current = null;

      if (speechAudioUrlRef.current) {
        URL.revokeObjectURL(
          speechAudioUrlRef.current,
        );
        speechAudioUrlRef.current = null;
      }

      const audioBlob = await generateVoiceSpeech({
        text,
        voice: settings.voice,
        speed: settings.speed,
      });

      const audioUrl =
        URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      speechAudioRef.current = audio;
      speechAudioUrlRef.current = audioUrl;

      await new Promise<void>((resolve, reject) => {
        const cleanupAudio = () => {
          if (speechAudioRef.current === audio) {
            speechAudioRef.current = null;
          }

          if (speechAudioUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            speechAudioUrlRef.current = null;
          }
        };

        audio.onended = () => {
          cleanupAudio();
          resolve();
        };

        audio.onerror = () => {
          cleanupAudio();
          reject(
            new Error(
              "The selected voice could not play the response.",
            ),
          );
        };

        audio.play().catch((error) => {
          cleanupAudio();
          reject(error);
        });
      });
    } catch (error) {
      console.error(
        "Voice playback failed:",
        error,
      );

      setVoiceError(
        error instanceof Error
          ? error.message
          : "The selected voice could not generate the response.",
      );
    }
  };

  const refreshSavedChats = (
    preferredChatId?: string,
  ) => {
    const chats = getAssistantChats();

    setSavedChats(chats);

    const nextActiveChat =
      chats.find(
        (chat) => chat.id === preferredChatId,
      ) ??
      chats.find(
        (chat) => chat.id === activeChatId,
      ) ??
      chats[0];

    if (nextActiveChat) {
      setActiveChatId(nextActiveChat.id);
      setMessages(nextActiveChat.messages);
    }
  };

  const persistMessages = (
    chatId: string,
    nextMessages: AssistantSavedMessage[],
  ) => {
    const existingChat =
      getAssistantChats().find(
        (chat) => chat.id === chatId,
      ) ??
      savedChats.find(
        (chat) => chat.id === chatId,
      );

    if (!existingChat) {
      return;
    }

    const updatedChat: AssistantSavedChat = {
      ...existingChat,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    };

    upsertAssistantChat(updatedChat);

    setMessages(nextMessages);
    setSavedChats(getAssistantChats());
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImageDataUrl(null);
    setAttachmentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stopMicrophoneStream = () => {
    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    mediaStreamRef.current = null;
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);
  };

  const startRecording = async () => {
    if (
      isSending ||
      isTranscribing ||
      isRecording
    ) {
      return;
    }

    setVoiceError("");

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setVoiceError(
        "Microphone recording is not available in this desktop environment.",
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setVoiceError(
        "Audio recording is not supported in this desktop environment.",
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mimeType =
        getSupportedAudioMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data,
          );
        }
      };

      recorder.onerror = () => {
        setIsRecording(false);
        setVoiceError(
          "Recording failed. Please check your microphone and try again.",
        );

        stopMicrophoneStream();
      };

      recorder.onstop = async () => {
        const chunks = [
          ...audioChunksRef.current,
        ];

        const recordingType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        stopMicrophoneStream();
        setIsRecording(false);

        if (chunks.length === 0) {
          setVoiceError(
            "No audio was recorded. Please try again.",
          );
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recordingType,
        });

        if (audioBlob.size === 0) {
          setVoiceError(
            "The recording was empty. Please try again.",
          );
          return;
        }

        setIsTranscribing(true);
        setVoiceError("");

        try {
          const transcript =
            await transcribeVoice(audioBlob);

          setMessage((currentMessage) => {
            const existing =
              currentMessage.trim();

            return existing
              ? `${existing} ${transcript}`
              : transcript;
          });
        } catch (error) {
          setVoiceError(
            error instanceof Error
              ? error.message
              : "Voice transcription failed. Please try again.",
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      stopMicrophoneStream();
      setIsRecording(false);

      if (
        error instanceof DOMException &&
        error.name === "NotAllowedError"
      ) {
        setVoiceError(
          "Microphone permission was denied. Allow Studio PAP to use the microphone in macOS System Settings.",
        );
        return;
      }

      if (
        error instanceof DOMException &&
        error.name === "NotFoundError"
      ) {
        setVoiceError(
          "No microphone was found. Check your microphone settings.",
        );
        return;
      }

      setVoiceError(
        error instanceof Error
          ? error.message
          : "The microphone could not be started.",
      );
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording();
  };

  const handleNewChat = () => {
    if (
      isSending ||
      isTranscribing ||
      isRecording
    ) {
      return;
    }

    const newChat = createAssistantChat();

    upsertAssistantChat(newChat);

    setSavedChats(getAssistantChats());
    setActiveChatId(newChat.id);
    setMessages(newChat.messages);
    setMessage("");
    setVoiceError("");
    setCollapsedTranscriptIds(new Set());
    setSpeakingMessageIds(new Set());
    clearSelectedImage();
  };

  const handleSelectChat = (
    chat: AssistantSavedChat,
  ) => {
    if (
      isSending ||
      isTranscribing ||
      isRecording ||
      chat.id === activeChatId
    ) {
      return;
    }

    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setMessage("");
    setVoiceError("");
    setCollapsedTranscriptIds(new Set());
    setSpeakingMessageIds(new Set());
    clearSelectedImage();
  };

  const handleDeleteChat = (
    chatId: string,
  ) => {
    if (
      isSending ||
      isTranscribing ||
      isRecording
    ) {
      return;
    }

    deleteAssistantChat(chatId);

    const remainingChats =
      getAssistantChats();

    if (remainingChats.length > 0) {
      setSavedChats(remainingChats);

      if (chatId === activeChatId) {
        setActiveChatId(
          remainingChats[0].id,
        );

        setMessages(
          remainingChats[0].messages,
        );
      }

      return;
    }

    const replacementChat =
      createAssistantChat();

    upsertAssistantChat(replacementChat);

    setSavedChats([replacementChat]);
    setActiveChatId(replacementChat.id);
    setMessages(replacementChat.messages);
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachmentError("");

    if (!file.type.startsWith("image/")) {
      setAttachmentError(
        "Please select a valid image file.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setAttachmentError(
        "Please choose an image smaller than 4 MB so it can be saved with the chat.",
      );

      event.target.value = "";
      return;
    }

    try {
      const dataUrl =
        await readFileAsDataUrl(file);

      setSelectedImage(file);
      setSelectedImageDataUrl(dataUrl);
    } catch (error) {
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "Could not attach the selected image.",
      );

      event.target.value = "";
    }
  };

  const showTranscript = (messageId: string) => {
    setCollapsedTranscriptIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(messageId);
      return nextIds;
    });
  };

  const markTranscriptCollapsed = (messageId: string) => {
    setCollapsedTranscriptIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(messageId);
      return nextIds;
    });
  };

  const markMessageSpeaking = (messageId: string) => {
    setSpeakingMessageIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(messageId);
      return nextIds;
    });
  };

  const markMessageFinishedSpeaking = (messageId: string) => {
    setSpeakingMessageIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(messageId);
      return nextIds;
    });
  };

  const handleSend = async () => {
    const trimmedMessage =
      message.trim();

    if (
      isSending ||
      isRecording ||
      isTranscribing ||
      (!trimmedMessage && !selectedImage)
    ) {
      return;
    }

    const currentChatId =
      activeChatId;

    if (!currentChatId) {
      return;
    }

    const question =
      trimmedMessage ||
      "Review this image and suggest improvements.";

    const imageFileForRequest =
      selectedImage;

    const imageDataUrlForHistory =
      selectedImageDataUrl;

    const imageNameForHistory =
      selectedImage?.name;

    const userMessage: AssistantSavedMessage =
      {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
        imageName: imageNameForHistory,
        imagePreviewUrl:
          imageDataUrlForHistory ??
          undefined,
      };

    const messagesWithUser = [
      ...messages,
      userMessage,
    ];

    persistMessages(
      currentChatId,
      messagesWithUser,
    );

    setMessage("");
    setVoiceError("");
    clearSelectedImage();
    setIsSending(true);

    try {
      const analysisHistory =
        getAnalysisHistory();

      const answer =
        await askAssistant({
          question,
          latest_analysis:
            analysisHistory[0] ?? null,
          image: imageFileForRequest,
        });

      const assistantMessage: AssistantSavedMessage =
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
        };

      const voiceSettings = getVoiceSettings();
      const shouldCollapseTranscript =
        voiceSettings.experience === "voice-only";
      const shouldSpeak =
        voiceSettings.experience !== "transcript-only" &&
        voiceSettings.autoSpeak;

      if (shouldCollapseTranscript) {
        markTranscriptCollapsed(assistantMessage.id);
      }

      if (shouldCollapseTranscript && shouldSpeak) {
        markMessageSpeaking(assistantMessage.id);
      }

      persistMessages(currentChatId, [
        ...messagesWithUser,
        assistantMessage,
      ]);

      refreshSavedChats(currentChatId);

      if (shouldSpeak) {
        void speakAssistantReply(
          answer,
          voiceSettings,
        ).finally(() => {
          markMessageFinishedSpeaking(
            assistantMessage.id,
          );
        });
      }
    } catch (error) {
      const errorMessage: AssistantSavedMessage =
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? `I could not complete that request.\n\n${error.message}`
              : "I could not complete that request. Please try again.",
        };

      persistMessages(currentChatId, [
        ...messagesWithUser,
        errorMessage,
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const interactionLocked =
    isSending ||
    isTranscribing ||
    isRecording;

  return (
    <section className="flex h-screen min-h-0 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <aside className="flex w-72 shrink-0 flex-col border-r border-[var(--border-primary)] bg-[var(--background-secondary)] p-5">
        <button
          type="button"
          onClick={handleNewChat}
          disabled={interactionLocked}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-3 font-semibold text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          New Chat
        </button>

        <div className="mt-6 min-h-0 flex-1">
          <p className="mb-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Saved Chats
          </p>

          <div className="max-h-full space-y-2 overflow-y-auto pr-1">
            {savedChats.map((chat) => {
              const isActive =
                chat.id === activeChatId;

              return (
                <div
                  key={chat.id}
                  className={
                    isActive
                      ? "group flex items-center gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-2"
                      : "group flex items-center gap-2 rounded-xl border border-transparent p-2 transition hover:border-[var(--border-primary)] hover:bg-[var(--background-soft)]"
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectChat(chat)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {chat.title}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatChatDate(
                        chat.updatedAt,
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteChat(chat.id)
                    }
                    disabled={
                      interactionLocked
                    }
                    className="rounded-lg p-2 text-[var(--text-muted)] opacity-0 transition hover:bg-red-400/10 hover:text-red-200 group-hover:opacity-100 disabled:cursor-not-allowed"
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[var(--border-primary)] px-8 py-6">
          <div className="flex items-center gap-3">
            <Bot
              size={26}
              className="text-[var(--accent-primary)]"
            />

            <div>
              <h1 className="text-2xl font-bold">
                Studio PAP Assistant
              </h1>

              <p className="text-[var(--text-secondary)]">
                AI Design Intelligence
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-8">
            {messages.map(
              (chatMessage) => (
                <div
                  key={chatMessage.id}
                  className={
                    chatMessage.role ===
                    "assistant"
                      ? "mr-auto max-w-3xl rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-[var(--text-primary)]"
                      : "ml-auto max-w-xl rounded-2xl bg-[var(--accent-primary)] p-5 text-[var(--button-text)]"
                  }
                >
                  {chatMessage.imagePreviewUrl ? (
                    <div className="mb-4 overflow-hidden rounded-xl bg-black/20 p-2">
                      <img
                        src={
                          chatMessage.imagePreviewUrl
                        }
                        alt={
                          chatMessage.imageName ??
                          "Uploaded design"
                        }
                        className="max-h-80 w-full rounded-lg object-contain"
                      />

                      {chatMessage.imageName ? (
                        <p className="mt-2 truncate text-xs opacity-70">
                          {
                            chatMessage.imageName
                          }
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {chatMessage.role ===
                  "assistant" ? (
                    speakingMessageIds.has(
                      chatMessage.id,
                    ) ? (
                      <div className="flex min-w-[250px] items-center gap-3 text-[var(--text-secondary)]">
                        <Volume2
                          size={19}
                          className="animate-pulse text-[var(--accent-primary)]"
                        />

                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            Assistant is speaking…
                          </p>

                          <p className="mt-1 text-sm text-[var(--text-muted)]">
                            The transcript will be available when the response is complete.
                          </p>
                        </div>
                      </div>
                    ) : collapsedTranscriptIds.has(
                        chatMessage.id,
                      ) ? (
                      <div className="min-w-[250px]">
                        <div className="flex items-center gap-2 text-[var(--accent-text)]">
                          <Check size={18} />
                          <span className="font-medium">
                            Response complete
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            showTranscript(
                              chatMessage.id,
                            )
                          }
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)] transition hover:text-[var(--accent-text)]"
                        >
                          Show Full Transcript
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    ) : (
                    <ReactMarkdown
                      components={{
                        h1: ({
                          children,
                        }) => (
                          <h1 className="mb-3 mt-5 text-xl font-semibold text-[var(--text-primary)] first:mt-0">
                            {children}
                          </h1>
                        ),

                        h2: ({
                          children,
                        }) => (
                          <h2 className="mb-3 mt-5 text-xl font-semibold text-[var(--text-primary)] first:mt-0">
                            {children}
                          </h2>
                        ),

                        h3: ({
                          children,
                        }) => (
                          <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--accent-primary)] first:mt-0">
                            {children}
                          </h3>
                        ),

                        p: ({
                          children,
                        }) => (
                          <p className="mb-3 leading-7 last:mb-0">
                            {children}
                          </p>
                        ),

                        ul: ({
                          children,
                        }) => (
                          <ul className="my-3 list-disc space-y-2 pl-6">
                            {children}
                          </ul>
                        ),

                        ol: ({
                          children,
                        }) => (
                          <ol className="my-3 list-decimal space-y-2 pl-6">
                            {children}
                          </ol>
                        ),

                        li: ({
                          children,
                        }) => (
                          <li className="leading-7">
                            {children}
                          </li>
                        ),

                        strong: ({
                          children,
                        }) => (
                          <strong className="font-semibold text-[var(--text-primary)]">
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {
                        chatMessage.content
                      }
                    </ReactMarkdown>

                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-7">
                      {
                        chatMessage.content
                      }
                    </p>
                  )}
                </div>
              ),
            )}

            {isSending ? (
              <div className="mr-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-[var(--text-secondary)]">
                <Loader2
                  size={18}
                  className="animate-spin text-[var(--accent-primary)]"
                />
                Studio PAP is thinking...
              </div>
            ) : null}

            {isTranscribing ? (
              <div className="mr-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--background-card)] p-5 text-[var(--text-secondary)]">
                <Loader2
                  size={18}
                  className="animate-spin text-[var(--accent-primary)]"
                />
                Transcribing your voice...
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-[var(--border-primary)] bg-[var(--background-secondary)] p-5">
            {selectedImageDataUrl ? (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] p-3">
                <img
                  src={selectedImageDataUrl}
                  alt="Selected image preview"
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {selectedImage?.name}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    Image will be saved with
                    this chat
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--background-soft)] hover:text-[var(--text-primary)]"
                  aria-label="Remove attached image"
                >
                  <X size={18} />
                </button>
              </div>
            ) : null}

            {attachmentError ? (
              <p className="mb-3 text-sm text-red-300">
                {attachmentError}
              </p>
            ) : null}

            {voiceError ? (
              <p className="mb-3 text-sm text-red-300">
                {voiceError}
              </p>
            ) : null}

            <div className="flex gap-3">
              <label
                className={
                  interactionLocked
                    ? "flex h-14 w-14 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] opacity-60"
                    : "flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
                }
              >
                <ImagePlus
                  size={20}
                  className="text-[var(--accent-primary)]"
                />

                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    void handleImageChange(
                      event,
                    );
                  }}
                  disabled={
                    interactionLocked
                  }
                />
              </label>

              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={
                  isSending ||
                  isTranscribing
                }
                className={
                  isRecording
                    ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-red-400/50 bg-red-400/10 text-red-300 shadow-[0_0_24px_rgba(248,113,113,0.18)] transition"
                    : "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)]  transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                }
                aria-label={
                  isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
                title={
                  isRecording
                    ? "Stop recording"
                    : "Start voice recording"
                }
              >
                {isRecording ? (
                  <MicOff size={20} />
                ) : (
                  <Mic size={20} />
                )}
              </button>

              <input
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={
                  isRecording
                    ? "Recording... click the mic again to stop"
                    : isTranscribing
                      ? "Transcribing..."
                      : "Ask Studio PAP..."
                }
                disabled={
                  isSending ||
                  isTranscribing
                }
                className="min-w-0 flex-1 rounded-xl border border-[var(--border-primary)] bg-[var(--background-card)] px-5 py-4 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]  disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  void handleSend()
                }
                disabled={
                  isSending ||
                  isRecording ||
                  isTranscribing ||
                  (!message.trim() &&
                    !selectedImage)
                }
                className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 font-semibold text-[var(--button-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} />
                Send
              </button>
            </div>

            {isRecording ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                Recording… click the microphone
                again when you finish speaking.
              </div>
            ) : null}

            {isTranscribing ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--accent-text)]">
                <Loader2
                  size={14}
                  className="animate-spin"
                />
                Converting your recording to
                text…
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </section>
  );
}