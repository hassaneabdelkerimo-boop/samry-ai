import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Sparkles,
  BookOpen,
  Calculator,
  PenTool,
  Code2,
  User,
  X,
  Globe,
  FileText,
  Printer,
  HeartPulse,
  Languages,
  Check,
  Image as ImageIcon,
  Info,
} from 'lucide-react';
import { Conversation, SubjectMode } from '../types';
import { SamryLogo } from './SamryLogo';
import { exportConversationAsMarkdown, exportConversationAsPdf } from '../utils/exportConversation';

interface SidebarProps {
  isOpen: boolean;
  isDesktopOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  currentMode: SubjectMode;
  onSelectConversation: (id: string) => void;
  onNewConversation: (mode?: SubjectMode) => void;
  onDeleteConversation: (id: string) => void;
  onOpenImageGen: () => void;
  onOpenAbout: () => void;
  onNotify: (msg: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isDesktopOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenImageGen,
  onOpenAbout,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<'md' | 'pdf' | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const hasMessages = Boolean(
    activeConversation && activeConversation.messages && activeConversation.messages.length > 0
  );

  const handleExportMd = () => {
    if (!activeConversation || !hasMessages) {
      onNotify('Aucun message à exporter dans cette conversation.');
      return;
    }
    if (exportConversationAsMarkdown(activeConversation)) {
      setExportFeedback('md');
      setTimeout(() => setExportFeedback(null), 2000);
    }
  };

  const handleExportPdf = () => {
    if (!activeConversation || !hasMessages) {
      onNotify('Aucun message à imprimer dans cette conversation.');
      return;
    }
    if (exportConversationAsPdf(activeConversation)) {
      setExportFeedback('pdf');
      setTimeout(() => setExportFeedback(null), 2000);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  });

  const modeIcons: Record<SubjectMode, React.ReactNode> = {
    general: <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />,
    news: <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />,
    study: <BookOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />,
    math: <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    medicine: <HeartPulse className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />,
    code: <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
    translate: <Languages className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />,
    writing: <PenTool className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />,
  };

  const quickModes: Array<{ id: SubjectMode; label: string; icon: React.ReactNode }> = [
    { id: 'news', label: 'Web Direct', icon: <Globe className="w-3.5 h-3.5 text-sky-500" /> },
    { id: 'translate', label: 'Traduction', icon: <Languages className="w-3.5 h-3.5 text-violet-500" /> },
    { id: 'math', label: 'Maths', icon: <Calculator className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5 text-cyan-500" /> },
    { id: 'study', label: 'Études', icon: <BookOpen className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'medicine', label: 'Médecine', icon: <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  const formatShortDate = (ts: number) => {
    const now = new Date();
    const d = new Date(ts);
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 w-[290px] sm:w-[300px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/90 flex flex-col transition-all duration-200 ease-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopOpen ? 'md:translate-x-0 md:flex' : 'md:hidden'}`}
      >
        {/* Mobile Header */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between md:hidden">
          <SamryLogo size="sm" showSubtitle={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Conversation */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewConversation('general');
              onClose();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* Specialized Modes */}
        <div className="px-3 pb-3 border-b border-slate-100 dark:border-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 mb-2">
            Assistants spécialisés
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onNewConversation(m.id);
                  onClose();
                }}
                className="min-h-[38px] flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
              >
                <span className="shrink-0">{m.icon}</span>
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search History */}
        <div className="px-3 pt-3 pb-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une discussion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* History List Header */}
        <div className="px-4 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Historique</span>
          <span className="tabular-nums">{filteredConversations.length}</span>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Aucun résultat trouvé.' : 'Aucune discussion enregistrée.'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isConfirming = deleteConfirmId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isConfirming) {
                      onSelectConversation(conv.id);
                      onClose();
                    }
                  }}
                  className={`group flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/40 text-slate-900 dark:text-white font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="shrink-0">{modeIcons[conv.mode || 'general']}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{conv.title || 'Nouvelle conversation'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                        {formatShortDate(conv.updatedAt)} · {conv.messages.length} msg
                      </p>
                    </div>
                  </div>

                  {/* Delete action */}
                  <div className="flex items-center shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-1.5 py-1 rounded-lg border border-red-300 dark:border-red-500/50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                            setDeleteConfirmId(null);
                          }}
                          className="text-[11px] text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 cursor-pointer"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="text-[11px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 cursor-pointer"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        aria-label="Supprimer la discussion"
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Studio & Export Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 space-y-2 bg-slate-50/70 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => {
              onOpenImageGen();
              onClose();
            }}
            className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>Studio d&apos;Images IA</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Ouvrir</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasMessages}
              onClick={handleExportMd}
              className="min-h-[38px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {exportFeedback === 'md' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Exporté</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export .md</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!hasMessages}
              onClick={handleExportPdf}
              className="min-h-[38px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {exportFeedback === 'pdf' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Prêt</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimer PDF</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenAbout();
              onClose();
            }}
            className="w-full pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2.5 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Créateur</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Oumar Hassane Abdelkerim
                </p>
              </div>
            </div>
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
