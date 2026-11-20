import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  Sparkles,
  User,
  FileText,
  RotateCcw,
  Calculator,
  Code2,
  Globe,
  ExternalLink,
  Share2,
  Maximize2,
  X,
  HeartPulse,
  Languages,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { Message, SubjectMode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SamryLogo } from './SamryLogo';
import { speakText, stopSpeaking } from '../utils/speech';
import { downloadImage, shareImage } from '../utils/imageActions';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSelectPrompt: (prompt: string, mode?: SubjectMode, webSearch?: boolean) => void;
  onOpenImageGen: () => void;
  onRegenerateLast?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSelectPrompt,
  onOpenImageGen,
  onRegenerateLast,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedImageId, setSharedImageId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; prompt: string } | null>(null);

  const lastMessageTextLength = messages[messages.length - 1]?.text?.length || 0;

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMessageTextLength, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSpeak = (msg: Message) => {
    if (speakingMessageId === msg.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setSpeakingMessageId(msg.id);
    const utterance = speakText(msg.text, {
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
    if (!utterance) {
      setSpeakingMessageId(null);
    }
  };

  const handleCopyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const starterSuggestions: Array<{
    category: string;
    icon: React.ReactNode;
    text: string;
    mode?: SubjectMode;
    webSearch?: boolean;
    isImage?: boolean;
  }> = [
    {
      category: 'Recherche Web en direct',
      icon: <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      text: 'Quelles sont les dernières actualités technologiques et scientifiques majeures de cette semaine ?',
      mode: 'news',
      webSearch: true,
    },
    {
      category: 'Mathématiques',
      icon: <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      text: 'Résous l\'équation 3x² - 7x + 2 = 0 étape par étape et vérifie les solutions.',
      mode: 'math',
    },
    {
      category: 'Code & Débogage',
      icon: <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      text: 'Écris une fonction TypeScript robuste pour paginer et filtrer une liste d\'objets avec gestion d\'erreurs.',
      mode: 'code',
    },
    {
      category: 'Médecine & Sciences',
      icon: <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      text: 'Explique clairement le fonctionnement du système immunitaire face aux infections virales.',
      mode: 'medicine',
    },
    {
      category: 'Traduction Multilingue',
      icon: <Languages className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
      text: 'Traduis en anglais, arabe et espagnol : "L\'intelligence artificielle transforme l\'éducation et la recherche."',
      mode: 'translate',
    },
    {
      category: 'Études & Synthèse',
      icon: <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      text: 'Prépare-moi une fiche de révision claire sur les lois de Newton avec des exemples concrets.',
      mode: 'study',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
      {messages.length === 0 ? (
        <div className="max-w-3xl mx-auto py-6 sm:py-12 flex flex-col items-center text-center">
          <div className="mb-4">
            <SamryLogo size="xl" showText={false} />
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2.5 text-balance">
            SAMRY AI PRO MAX
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mb-3 leading-relaxed">
            Assistant professionnel pour vos recherches Web en direct, l&apos;analyse de PDF et d&apos;images, la programmation, les mathématiques, la médecine, les études et la traduction.
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">
            Créé par <strong className="font-semibold text-slate-800 dark:text-slate-200">Oumar Hassane Abdelkerim</strong>
            <span aria-hidden="true"> · </span>
            <span>Moteur Gemini 4 Hydrogen</span>
          </p>

          {/* Starter Suggestions Grid */}
          <div className="w-full text-left">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Exemples pour démarrer
              </span>
              <button
                type="button"
                onClick={onOpenImageGen}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Ouvrir le Studio d&apos;Images</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {starterSuggestions.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (item.isImage) {
                      onOpenImageGen();
                    } else {
                      onSelectPrompt(item.text, item.mode, item.webSearch);
                    }
                  }}
                  className="min-h-[88px] p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 text-left transition-colors cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="shrink-0 pt-0.5 hidden sm:block">
                    <SamryLogo size="sm" showText={false} showSubtitle={false} />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 sm:p-5 transition-colors ${
                    isUser
                      ? 'max-w-[88%] sm:max-w-[78%] bg-indigo-600 text-white rounded-tr-sm shadow-xs'
                      : msg.isError
                      ? 'w-full sm:max-w-[92%] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/40 text-red-900 dark:text-red-200 rounded-tl-sm'
                      : 'w-full sm:max-w-[92%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}
                >
                  {/* Attachment Display */}
                  {msg.attachment && (
                    <div className="mb-3">
                      {msg.attachment.type === 'image' && msg.attachment.previewUrl ? (
                        <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/15 max-w-sm">
                          <img
                            src={msg.attachment.previewUrl}
                            alt={msg.attachment.name}
                            onClick={() =>
                              setLightboxImage({
                                url: msg.attachment!.previewUrl!,
                                prompt: msg.attachment!.name,
                              })
                            }
                            className="w-full h-auto max-h-60 object-cover cursor-pointer"
                          />
                          <div className="px-2.5 py-1.5 bg-black/30 text-[11px] text-white/90 truncate">
                            {msg.attachment.name}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs ${
                            isUser
                              ? 'bg-indigo-700/60 border-indigo-400/40 text-white'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{msg.attachment.name}</p>
                            <p className="text-[11px] opacity-80 tabular-nums">
                              {(msg.attachment.size / 1024).toFixed(1)} Ko ·{' '}
                              {msg.attachment.type === 'pdf' ? 'Document PDF' : 'Fichier texte/code'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generated Image */}
                  {msg.generatedImageUrl && (
                    <div className="my-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div
                        className="relative cursor-pointer group"
                        onClick={() =>
                          setLightboxImage({
                            url: msg.generatedImageUrl!,
                            prompt: msg.imagePrompt || 'Image SAMRY AI PRO MAX',
                          })
                        }
                      >
                        <img
                          src={msg.generatedImageUrl}
                          alt={msg.imagePrompt || 'Image générée par SAMRY AI PRO MAX'}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-96 object-contain mx-auto"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                          <Maximize2 className="w-4 h-4" />
                          <span>Agrandir</span>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs italic">
                          &ldquo;{msg.imagePrompt}&rdquo;
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!msg.generatedImageUrl) return;
                              const res = await shareImage(msg.generatedImageUrl, msg.imagePrompt);
                              if (res.success) {
                                setSharedImageId(msg.id);
                                setTimeout(() => setSharedImageId(null), 2500);
                              }
                            }}
                            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
                          >
                            {sharedImageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Partagé</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Partager</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (msg.generatedImageUrl) {
                                downloadImage(msg.generatedImageUrl, msg.imagePrompt);
                              }
                            }}
                            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.text ? (
                    isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
                    ) : (
                      <div className="relative">
                        <MarkdownRenderer content={msg.text} />
                        {msg.isStreaming && (
                          <span
                            className="inline-block w-2 h-4 ml-1 align-middle bg-indigo-500 animate-pulse rounded-xs"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    )
                  ) : (
                    msg.isStreaming && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
                        {msg.isSearching ? (
                          <>
                            <Globe className="w-4 h-4 text-sky-500 animate-spin" />
                            <span>Recherche en temps réel sur Internet...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span>SAMRY AI PRO MAX analyse votre demande...</span>
                          </>
                        )}
                      </div>
                    )
                  )}

                  {/* Verified Web Grounding Sources */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Sources Internet vérifiées ({msg.sources.length})</span>
                        </span>
                        <span className="text-[11px] truncate">
                          {msg.enginesUsed && msg.enginesUsed.length > 0
                            ? msg.enginesUsed.join(' · ')
                            : 'Recherche Web en direct'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => {
                          let domain = src.siteName || '';
                          if (!domain) {
                            try {
                              domain = new URL(src.url).hostname.replace('www.', '');
                            } catch {
                              domain = 'Source Web';
                            }
                          }

                          return (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
                                  {src.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {domain}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Error Action */}
                  {!isUser && msg.isError && onRegenerateLast && (
                    <div className="mt-3 pt-2.5 border-t border-red-200 dark:border-red-500/20 flex items-center justify-between gap-2 text-xs">
                      <span className="text-red-700 dark:text-red-300">Réponse interrompue</span>
                      <button
                        type="button"
                        onClick={onRegenerateLast}
                        className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Réessayer</span>
                      </button>
                    </div>
                  )}

                  {/* Assistant Footer Toolbar */}
                  {!isUser && !msg.isError && !msg.isStreaming && msg.text && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg)}
                          className={`min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            speakingMessageId === msg.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                          title={speakingMessageId === msg.id ? 'Arrêter la lecture' : 'Écouter la réponse'}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Arrêter</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Écouter</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Copier le message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {msg.modelUsed || 'gemini-4-hydrogen'}
                      </span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="shrink-0 pt-0.5 hidden sm:block">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={scrollEndRef} />
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Fermer l'aperçu"
              className="absolute -top-12 right-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.prompt}
              referrerPolicy="no-referrer"
              className="w-auto h-auto max-w-full max-h-[78vh] object-contain rounded-xl border border-slate-700"
            />
            <div className="mt-3 flex items-center justify-between w-full gap-4 text-xs text-slate-200">
              <span className="truncate max-w-md">{lightboxImage.prompt}</span>
              <button
                type="button"
                onClick={() => downloadImage(lightboxImage.url, lightboxImage.prompt)}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
