import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  Message,
  SubjectMode,
  LanguageCode,
  Attachment,
  ImageCategory,
  ThinkingDepth,
  GroundingSource,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { ImageGenModal } from './components/ImageGenModal';
import { AboutModal } from './components/AboutModal';

const STORAGE_KEY = 'samry_ai_pro_max_conversations_v1';
const LEGACY_STORAGE_KEY = 'samry_ai_conversations_v2';
const THEME_KEY = 'samry_ai_theme';

function createEmptyConversation(mode: SubjectMode = 'general'): Conversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: 'Nouvelle conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mode,
    messages: [],
  };
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [currentMode, setCurrentMode] = useState<SubjectMode>('general');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('auto');
  const [thinkingDepth, setThinkingDepth] = useState<ThinkingDepth>('medium');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized: Conversation[] = parsed
              .filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string')
              .map((c: any) => ({
                id: c.id,
                title: typeof c.title === 'string' ? c.title : 'Nouvelle conversation',
                createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
                updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
                mode: (typeof c.mode === 'string' ? c.mode : 'general') as SubjectMode,
                messages: Array.isArray(c.messages)
                  ? c.messages
                      .filter((m: any) => m && typeof m === 'object' && typeof m.id === 'string')
                      .map((m: any) => ({
                        ...m,
                        isStreaming: false,
                        text:
                          typeof m.text === 'string' && m.text.trim().length > 0
                            ? m.text
                            : m.role === 'assistant' && !m.generatedImageUrl
                            ? 'Réponse interrompue.'
                            : m.text || '',
                      }))
                  : [],
              }));
            if (sanitized.length > 0) return sanitized;
          }
        }
      } catch (e) {
        console.error('Erreur chargement historique:', e);
      }
    }
    return [createEmptyConversation('general')];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || '';
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Persist conversations safely (stripping old heavy base64 blobs on quota overflow)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      try {
        const compacted = conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            attachment: m.attachment
              ? { ...m.attachment, base64: '', previewUrl: undefined }
              : undefined,
            generatedImageUrl: undefined,
          })),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
      } catch (e) {
        console.error('Impossible de sauvegarder l\'historique:', e);
      }
    }
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNewConversation = (mode: SubjectMode = 'general') => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
    const newConv = createEmptyConversation(mode);
    setCurrentMode(mode);
    setConversations((prev) => [
      newConv,
      ...prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
      })),
    ]);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fallback = createEmptyConversation('general');
        setActiveConversationId(fallback.id);
        setCurrentMode('general');
        return [fallback];
      }
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
        setCurrentMode(remaining[0].mode || 'general');
      }
      return remaining;
    });
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.isStreaming ? { ...m, isStreaming: false } : m
              ),
            }
          : c
      )
    );
  };

  const handleSendMessage = async (
    text: string,
    attachment?: Attachment,
    webSearch?: boolean,
    overrideMode?: SubjectMode,
    retryFromIndex?: number
  ) => {
    if ((!text && !attachment) || isLoading) return;

    const targetConvId = activeConversation.id;
    const effectiveMode = overrideMode || currentMode;
    if (overrideMode) setCurrentMode(overrideMode);

    const userMessage: Message = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text,
      timestamp: Date.now(),
      attachment,
      mode: effectiveMode,
    };

    const assistantMsgId = `msg-${Date.now() + 1}-a`;
    const placeholderAssistant: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      timestamp: Date.now() + 1,
      mode: effectiveMode,
      isStreaming: true,
    };

    const baseMessages =
      typeof retryFromIndex === 'number' && retryFromIndex >= 0
        ? activeConversation.messages.slice(0, retryFromIndex)
        : activeConversation.messages;

    const isFirstMessage = baseMessages.length === 0;
    const newTitle = isFirstMessage
      ? text
        ? text.slice(0, 36) + (text.length > 36 ? '...' : '')
        : attachment
        ? `Analyse : ${attachment.name}`
        : 'Nouvelle conversation'
      : activeConversation.title;

    const priorMessages = baseMessages;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              title: newTitle,
              mode: effectiveMode,
              updatedAt: Date.now(),
              messages: [
                ...(typeof retryFromIndex === 'number' && retryFromIndex >= 0
                  ? c.messages.slice(0, retryFromIndex)
                  : c.messages),
                userMessage,
                placeholderAssistant,
              ],
            }
          : c
      )
    );

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestPayload = {
      messages: priorMessages,
      currentMessage: text,
      mode: effectiveMode,
      language: currentLanguage,
      webSearch: Boolean(webSearch) || effectiveMode === 'news',
      thinkingDepth,
      attachment: attachment
        ? {
            name: attachment.name,
            mimeType: attachment.mimeType,
            type: attachment.type,
            base64: attachment.base64,
            textContent: attachment.textContent,
          }
        : undefined,
    };

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok || !response.body) {
        throw new Error('STREAM_UNAVAILABLE');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let finalModel = 'gemini-4-hydrogen';
      let finalSources: GroundingSource[] = [];
      let finalEnginesUsed: string[] = [];
      let finalGrounded = false;
      let streamError: string | null = null;
      let requiresPaidKey = false;

      const processSseBlock = (block: string) => {
        const lines = block.split(/\r?\n/);
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === 'status') {
              if (payload.model) finalModel = payload.model;
              if (Array.isArray(payload.enginesUsed)) finalEnginesUsed = payload.enginesUsed;
              const searchingNow = Boolean(payload.searching);
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMsgId
                            ? {
                                ...m,
                                isSearching: searchingNow,
                                enginesUsed: Array.isArray(payload.enginesUsed)
                                  ? payload.enginesUsed
                                  : m.enginesUsed,
                              }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (payload.type === 'chunk' && payload.text) {
              accumulatedText += payload.text;
              const currentTextSnapshot = accumulatedText;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetConvId
                    ? {
                        ...c,
                        updatedAt: Date.now(),
                        messages: c.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, text: currentTextSnapshot, isSearching: false }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (payload.type === 'done') {
              finalModel = payload.model || finalModel;
              finalSources = Array.isArray(payload.sources) ? payload.sources : [];
              finalEnginesUsed = Array.isArray(payload.enginesUsed)
                ? payload.enginesUsed
                : finalEnginesUsed;
              finalGrounded = Boolean(payload.isGrounded);
            } else if (payload.type === 'error') {
              streamError = payload.error || 'Erreur de génération.';
              requiresPaidKey = Boolean(payload.requiresPaidKey);
            }
          } catch {
            // Ignore malformed partial SSE line
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';
        for (const evt of events) {
          processSseBlock(evt);
        }
      }

      if (buffer.trim()) {
        processSseBlock(buffer);
      }

      // Automatic reliable JSON fallback (/api/chat) if stream yielded no text and no explicit error
      if (!accumulatedText && !streamError) {
        const jsonRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
        const jsonData = await jsonRes.json();
        if (!jsonRes.ok) {
          streamError = jsonData?.error || 'Erreur lors du traitement de votre demande.';
          requiresPaidKey = Boolean(jsonData?.requiresPaidKey);
        } else if (jsonData?.reply) {
          accumulatedText = jsonData.reply;
          finalModel = jsonData.model || finalModel;
          finalSources = Array.isArray(jsonData.sources) ? jsonData.sources : [];
          finalEnginesUsed = Array.isArray(jsonData.enginesUsed) ? jsonData.enginesUsed : [];
          finalGrounded = Boolean(jsonData.isGrounded);
        }
      }

      if (streamError && !accumulatedText) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          text: streamError!,
                          isStreaming: false,
                          isSearching: false,
                          isError: true,
                          requiresPaidKey,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          text: accumulatedText || 'Aucune réponse générée. Veuillez réessayer.',
                          isStreaming: false,
                          isSearching: false,
                          modelUsed: finalModel,
                          sources: finalSources,
                          enginesUsed: finalEnginesUsed,
                          isGrounded: finalGrounded,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, isStreaming: false, isSearching: false, text: m.text || 'Génération arrêtée.' }
                      : m
                  ),
                }
              : c
          )
        );
        return;
      }

      // Final rescue attempt via non-streaming /api/chat if streaming threw
      try {
        const rescueRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
        const rescueData = await rescueRes.json();
        if (rescueRes.ok && rescueData?.reply) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            text: rescueData.reply,
                            isStreaming: false,
                            isSearching: false,
                            modelUsed: rescueData.model || 'gemini-4-hydrogen',
                            sources: Array.isArray(rescueData.sources) ? rescueData.sources : [],
                            enginesUsed: Array.isArray(rescueData.enginesUsed) ? rescueData.enginesUsed : [],
                            isGrounded: Boolean(rescueData.isGrounded),
                          }
                        : m
                    ),
                  }
                : c
            )
          );
          return;
        }
      } catch {
        // Fall through to clean error display
      }

      const fallbackMessage =
        error?.message && error.message !== 'STREAM_UNAVAILABLE'
          ? error.message
          : 'La connexion au serveur SAMRY AI PRO MAX a été interrompue. Veuillez réessayer.';

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        text: fallbackMessage,
                        isStreaming: false,
                        isError: true,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleInsertGeneratedImage = (
    imageUrl: string,
    prompt: string,
    category?: ImageCategory,
    style?: string
  ) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: `Générer une image : "${prompt}"`,
      timestamp: Date.now(),
    };

    const assistantMsg: Message = {
      id: `msg-${Date.now() + 1}-a`,
      role: 'assistant',
      text: `Image générée pour : **${prompt}**`,
      timestamp: Date.now() + 1,
      generatedImageUrl: imageUrl,
      imagePrompt: prompt,
      imageCategory: category,
      imageStyle: style,
      modelUsed: 'gemini-3.1-flash-lite-image',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: c.messages.length === 0 ? `Image : ${prompt.slice(0, 24)}...` : c.title,
              updatedAt: Date.now(),
              messages: [...c.messages, userMsg, assistantMsg],
            }
          : c
      )
    );
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        onToggleDesktopSidebar={() => setIsDesktopSidebarOpen((prev) => !prev)}
        onNewConversation={() => handleNewConversation('general')}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenImageGen={() => setIsImageGenOpen(true)}
        currentLanguage={currentLanguage}
        onChangeLanguage={(l) => setCurrentLanguage(l)}
      />

      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-lg border border-slate-700 max-w-[90vw] text-center"
        >
          {toastMessage}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          isDesktopOpen={isDesktopSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          conversations={conversations}
          activeConversationId={activeConversation.id}
          currentMode={currentMode}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            const found = conversations.find((c) => c.id === id);
            if (found?.mode) setCurrentMode(found.mode);
          }}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenImageGen={() => setIsImageGenOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onNotify={showToast}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <ChatArea
            messages={activeConversation?.messages || []}
            isLoading={isLoading}
            onSelectPrompt={(prompt, mode, webSearch) => {
              handleSendMessage(prompt, undefined, webSearch, mode);
            }}
            onOpenImageGen={() => setIsImageGenOpen(true)}
            onRegenerateLast={() => {
              const msgs = activeConversation?.messages || [];
              let lastUserIdx = -1;
              for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].role === 'user') {
                  lastUserIdx = i;
                  break;
                }
              }
              if (lastUserIdx >= 0) {
                const lastUser = msgs[lastUserIdx];
                handleSendMessage(
                  lastUser.text,
                  lastUser.attachment,
                  false,
                  lastUser.mode,
                  lastUserIdx
                );
              }
            }}
          />

          <ChatInput
            onSendMessage={(text, att, web) => handleSendMessage(text, att, web)}
            onStopGenerating={handleStopGenerating}
            onOpenImageGen={() => setIsImageGenOpen(true)}
            isLoading={isLoading}
            currentMode={currentMode}
            onChangeMode={(m) => setCurrentMode(m)}
            currentLanguage={currentLanguage}
            thinkingDepth={thinkingDepth}
            onChangeThinkingDepth={(d) => setThinkingDepth(d)}
            onNotify={showToast}
          />
        </main>
      </div>

      <ImageGenModal
        isOpen={isImageGenOpen}
        onClose={() => setIsImageGenOpen(false)}
        onGenerated={handleInsertGeneratedImage}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
