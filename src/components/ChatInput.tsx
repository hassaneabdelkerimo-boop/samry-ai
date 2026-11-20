import React, { useRef, useState, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  Globe,
  Sparkles,
  Brain,
  Image as ImageIcon,
} from 'lucide-react';
import { Attachment, SubjectMode, LanguageCode, ThinkingDepth } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: Attachment, webSearch?: boolean) => void;
  onStopGenerating: () => void;
  onOpenImageGen: () => void;
  isLoading: boolean;
  currentMode: SubjectMode;
  onChangeMode: (mode: SubjectMode) => void;
  currentLanguage: LanguageCode;
  thinkingDepth: ThinkingDepth;
  onChangeThinkingDepth: (depth: ThinkingDepth) => void;
  onNotify: (msg: string) => void;
}

const TEXT_FILE_EXTENSIONS = [
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.py',
  '.html',
  '.css',
  '.sql',
  '.xml',
  '.yaml',
  '.yml',
  '.log',
  '.java',
  '.c',
  '.cpp',
  '.php',
  '.sh',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGenerating,
  onOpenImageGen,
  isLoading,
  currentMode,
  onChangeMode,
  currentLanguage,
  thinkingDepth,
  onChangeThinkingDepth,
  onNotify,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);

  const effectiveWebSearch = isWebSearchActive || currentMode === 'news';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onNotify('La dictée vocale n\'est pas disponible sur ce navigateur.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (currentLanguage === 'ar') recognition.lang = 'ar-SA';
      else if (currentLanguage === 'en') recognition.lang = 'en-US';
      else if (currentLanguage === 'es') recognition.lang = 'es-ES';
      else recognition.lang = 'fr-FR';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          onNotify('Accès au microphone refusé. Veuillez autoriser le micro.');
        } else {
          onNotify('Erreur lors de la dictée vocale.');
        }
      };
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
      onNotify('Impossible de démarrer le microphone.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 18 * 1024 * 1024) {
      onNotify('Le fichier dépasse la limite autorisée de 18 Mo.');
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isTextFile =
      file.type.startsWith('text/') ||
      TEXT_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isImage && !isPdf && !isTextFile) {
      onNotify('Format supporté : PDF, Images (PNG/JPG/WebP) et fichiers texte/code (.txt, .csv, .json, .py, .ts, etc.).');
      return;
    }

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          base64: '',
          textContent: String(reader.result || ''),
          type: 'text',
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachment({
          name: file.name,
          mimeType: file.type || (isImage ? 'image/jpeg' : 'application/pdf'),
          size: file.size,
          base64,
          previewUrl: isImage ? base64 : undefined,
          type: isImage ? 'image' : 'pdf',
        });
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            setAttachment({
              name: file.name || `capture-${Date.now()}.png`,
              mimeType: file.type || 'image/png',
              size: file.size,
              base64,
              previewUrl: base64,
              type: 'image',
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && !attachment) || isLoading) return;
    onSendMessage(inputText.trim(), attachment || undefined, effectiveWebSearch);
    setInputText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modesList: Array<{ id: SubjectMode; label: string }> = [
    { id: 'general', label: 'Général' },
    { id: 'news', label: 'Web Direct' },
    { id: 'study', label: 'Études & Sciences' },
    { id: 'math', label: 'Mathématiques' },
    { id: 'medicine', label: 'Médecine' },
    { id: 'code', label: 'Code & IT' },
    { id: 'translate', label: 'Traduction' },
    { id: 'writing', label: 'Rédaction' },
  ];

  const modePlaceholders: Record<SubjectMode, string> = {
    general: 'Posez votre question, joignez un PDF ou une image...',
    news: 'Posez une question sur l\'actualité, la météo, le sport ou l\'économie...',
    study: 'Demandez une explication de cours, une fiche ou une aide scientifique...',
    math: 'Entrez une équation, un problème ou une démonstration mathématique...',
    medicine: 'Posez une question sur l\'anatomie, la physiologie ou un terme médical...',
    code: 'Collez votre code à corriger ou décrivez la fonctionnalité à programmer...',
    translate: 'Collez un texte et indiquez la langue souhaitée (ex: en anglais, arabe, espagnol)...',
    writing: 'Demandez la rédaction ou la correction d\'un CV, e-mail, lettre ou rapport...',
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-safe pt-1 shrink-0">
      {/* Compact Horizontal Mode Selector (Touch-friendly on Android, crisp on Desktop) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
        {modesList.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMode(m.id)}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Main Composer Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 shadow-sm transition-colors">
        {/* Attachment Preview */}
        {attachment && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 rounded-t-2xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {attachment.type === 'image' && attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {(attachment.size / 1024).toFixed(1)} Ko ·{' '}
                    {attachment.type === 'image'
                      ? 'Image'
                      : attachment.type === 'pdf'
                      ? 'PDF'
                      : 'Fichier texte/code'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Retirer la pièce jointe"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {attachment.type === 'pdf' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setInputText('Fais un résumé complet et structuré de ce document PDF avec les points clés.')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                  >
                    Résumer ce PDF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInputText('Extrais tous les chiffres, dates et conclusions importantes de ce document.')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                  >
                    Points clés
                  </button>
                </>
              )}
              {attachment.type === 'text' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setInputText('Analyse ce fichier, explique son fonctionnement et corrige d\'éventuelles erreurs.')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                  >
                    Analyser &amp; corriger
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInputText('Résume les données essentielles contenues dans ce fichier.')
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                  >
                    Synthétiser
                  </button>
                </>
              )}
              {attachment.type === 'image' && (
                <button
                  type="button"
                  onClick={() =>
                    setInputText('Analyse en détail cette image, lis tout texte visible et explique son contenu.')
                  }
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 cursor-pointer"
                >
                  Analyser l&apos;image
                </button>
              )}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="px-3.5 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={modePlaceholders[currentMode]}
            rows={1}
            dir={currentLanguage === 'ar' ? 'rtl' : 'auto'}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none text-[15px] leading-relaxed max-h-40"
          />
        </div>

        {/* Bottom Controls Bar */}
        <div className="px-2.5 pb-2.5 pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.sql,.xml,.yaml,.yml,.log"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Joindre un fichier ou une image"
              title="Joindre PDF, Image ou Fichier code/texte"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              aria-label={isRecording ? 'Arrêter la dictée' : 'Dicter un message'}
              title="Dictée vocale"
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentMode === 'news') {
                  onChangeMode('general');
                  setIsWebSearchActive(false);
                } else {
                  setIsWebSearchActive((prev) => !prev);
                }
              }}
              aria-pressed={effectiveWebSearch}
              title="Activer ou désactiver la recherche Internet en temps réel (Web Direct)"
              className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                effectiveWebSearch
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50 font-semibold'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${effectiveWebSearch ? 'text-sky-500' : ''}`} />
              <span>{effectiveWebSearch ? 'Web Direct actif' : 'Web Direct'}</span>
            </button>

            {/* Thinking Depth Selector */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shrink-0">
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={thinkingDepth}
                onChange={(e) => onChangeThinkingDepth(e.target.value as ThinkingDepth)}
                aria-label="Profondeur de réflexion"
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="low" className="bg-white dark:bg-slate-900">Rapide</option>
                <option value="medium" className="bg-white dark:bg-slate-900">Équilibré</option>
                <option value="high" className="bg-white dark:bg-slate-900">Approfondi</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenImageGen}
              title="Ouvrir le Studio d'Images IA"
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer md:hidden"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Arrêter</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && !attachment}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Envoyer</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiet Footer Line */}
      <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400 truncate">
        SAMRY AI PRO MAX · Oumar Hassane Abdelkerim · Vérifiez les informations importantes.
      </p>
    </div>
  );
};
