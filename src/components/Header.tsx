import React from 'react';
import {
  Menu,
  PanelLeft,
  Plus,
  Sun,
  Moon,
  Info,
  Sparkles,
  Globe,
} from 'lucide-react';
import { SamryLogo } from './SamryLogo';
import { LanguageCode } from '../types';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
  isDesktopSidebarOpen: boolean;
  onToggleDesktopSidebar: () => void;
  onNewConversation: () => void;
  onOpenAbout: () => void;
  onOpenImageGen: () => void;
  currentLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenSidebar,
  isDesktopSidebarOpen,
  onToggleDesktopSidebar,
  onNewConversation,
  onOpenAbout,
  onOpenImageGen,
  currentLanguage,
  onChangeLanguage,
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Zone 1: Navigation Toggle + Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Ouvrir l'historique des discussions"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          aria-label={isDesktopSidebarOpen ? 'Masquer le panneau latéral' : 'Afficher le panneau latéral'}
          title={isDesktopSidebarOpen ? 'Masquer l\'historique' : 'Afficher l\'historique'}
          className="hidden md:flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenAbout}
          className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          title="À propos de SAMRY AI PRO MAX"
        >
          <SamryLogo size="sm" showSubtitle={false} />
        </button>
      </div>

      {/* Zone 2: Language & Image Studio Quick Links (Desktop/Tablet) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button
          type="button"
          onClick={onOpenImageGen}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Studio Images</span>
        </button>

        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <label htmlFor="header-lang-select" className="sr-only">
            Langue de réponse
          </label>
          <select
            id="header-lang-select"
            value={currentLanguage}
            onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white outline-none cursor-pointer"
          >
            <option value="auto" className="bg-white dark:bg-slate-900">Langue : Auto (FR)</option>
            <option value="fr" className="bg-white dark:bg-slate-900">Français</option>
            <option value="en" className="bg-white dark:bg-slate-900">English</option>
            <option value="ar" className="bg-white dark:bg-slate-900">العربية</option>
            <option value="es" className="bg-white dark:bg-slate-900">Español</option>
            <option value="de" className="bg-white dark:bg-slate-900">Deutsch</option>
            <option value="it" className="bg-white dark:bg-slate-900">Italiano</option>
            <option value="pt" className="bg-white dark:bg-slate-900">Português</option>
            <option value="zh" className="bg-white dark:bg-slate-900">中文</option>
            <option value="ru" className="bg-white dark:bg-slate-900">Русский</option>
            <option value="tr" className="bg-white dark:bg-slate-900">Türkçe</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Modèles & Info</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action + Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        <button
          type="button"
          onClick={onNewConversation}
          className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          title="Démarrer une nouvelle conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle conversation</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>
    </header>
  );
};
