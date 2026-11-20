import React from 'react';
import {
  X,
  User,
  Globe,
  FileText,
  Calculator,
  HeartPulse,
  Code2,
  Languages,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { SamryLogo } from './SamryLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const capabilities = [
    {
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      title: 'Assistant IA Avancé',
      desc: 'Réponses structurées, précises et rapides avec conservation du contexte.',
    },
    {
      icon: <Globe className="w-4 h-4 text-sky-500" />,
      title: 'Recherche Web en Direct',
      desc: 'Actualités, scores sportifs et événements récents vérifiés (DuckDuckGo, Actualités, ESPN, Wikipédia).',
    },
    {
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      title: 'Analyse PDF, Images & Fichiers',
      desc: 'Lecture et synthèse de documents PDF, photos, captures d\'écran, code et CSV.',
    },
    {
      icon: <Languages className="w-4 h-4 text-violet-500" />,
      title: 'Traduction Multilingue',
      desc: 'Traduction fidèle entre français, anglais, arabe, espagnol, allemand, chinois, etc.',
    },
    {
      icon: <Calculator className="w-4 h-4 text-emerald-500" />,
      title: 'Mathématiques & Sciences',
      desc: 'Raisonnement étape par étape, équations, physique, chimie et biologie.',
    },
    {
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      title: 'Études & Rédaction Pro',
      desc: 'Fiches de révision, CV, lettres de motivation, rapports et correction orthographique.',
    },
    {
      icon: <HeartPulse className="w-4 h-4 text-rose-500" />,
      title: 'Médecine & Santé',
      desc: 'Explications scientifiques claires (information éducative ne remplaçant pas un médecin).',
    },
    {
      icon: <Code2 className="w-4 h-4 text-cyan-500" />,
      title: 'Code & Architecture',
      desc: 'Génération, débogage et optimisation en TypeScript, Python, Java, SQL, etc.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <SamryLogo size="lg" showText={false} />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                SAMRY AI PRO MAX
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Créateur : <strong className="text-slate-900 dark:text-slate-200">Oumar Hassane Abdelkerim</strong></span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Capacités Professionnelles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
                >
                  <span className="mt-0.5 shrink-0">{cap.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{cap.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Architecture & Pricing Tier Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Architecture Sécurisée &amp; Modèles Utilisés</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Toutes les requêtes passent exclusivement par le serveur sécurisé (<span className="font-mono">GEMINI_API_KEY</span> jamais exposée côté navigateur).
            </p>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-900 dark:text-slate-200">Formule économique gratuite :</strong>{' '}
                <span className="font-mono">gemini-4-hydrogen</span> (et <span className="font-mono">gemini-3.1-flash-lite</span> en secours) pour le chat en streaming, recherche Web &amp; scores en direct, PDF, vision, code, maths, médecine et traduction.
              </li>
              <li className="flex items-start gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900 dark:text-slate-200">Nécessite une clé payante (Settings &gt; Secrets) :</strong>{' '}
                  Génération d&apos;images (<span className="font-mono">gemini-3.1-flash-lite-image</span> / <span className="font-mono">gemini-nano-banana-2.1</span>). Aucun résultat factice n&apos;est simulé sans API active.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            SAMRY AI PRO MAX · Oumar Hassane Abdelkerim
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
