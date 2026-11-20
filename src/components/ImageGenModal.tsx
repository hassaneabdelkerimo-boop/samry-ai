import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Share2,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Check,
  Maximize2,
} from 'lucide-react';
import { ImageCategory, ImageStyle } from '../types';
import { downloadImage, shareImage } from '../utils/imageActions';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (imageUrl: string, prompt: string, category?: ImageCategory, style?: string) => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const [category, setCategory] = useState<ImageCategory>('portrait');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [requiresPaidKey, setRequiresPaidKey] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const categories: Array<{ id: ImageCategory; label: string; ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; style: ImageStyle }> = [
    { id: 'portrait', label: 'Portrait', ratio: '3:4', style: 'photorealistic' },
    { id: 'landscape', label: 'Paysage', ratio: '16:9', style: 'cinematic' },
    { id: 'poster', label: 'Affiche', ratio: '9:16', style: 'typography_poster' },
    { id: 'logo', label: 'Logo', ratio: '1:1', style: 'vector_logo' },
    { id: 'free', label: 'Libre', ratio: '1:1', style: 'digital_art' },
  ];

  const stylesList: Array<{ id: ImageStyle; label: string }> = [
    { id: 'photorealistic', label: 'Photoréaliste' },
    { id: 'cinematic', label: 'Cinématique' },
    { id: '3d_render', label: 'Rendu 3D' },
    { id: 'digital_art', label: 'Art Numérique' },
    { id: 'anime', label: 'Animation' },
    { id: 'vector_logo', label: 'Logo Vectoriel' },
    { id: 'typography_poster', label: 'Affiche Graphique' },
    { id: 'oil_painting', label: 'Peinture Classique' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setRequiresPaidKey(false);
    setGeneratedImage(null);
    setShareFeedback(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, category, aspectRatio, style }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresPaidKey) setRequiresPaidKey(true);
        throw new Error(data.error || 'Impossible de générer l\'image.');
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedModel(data.modelUsed || 'gemini-3.1-flash-lite-image');
    } catch (err: any) {
      setError(err.message || 'Le service de génération d\'images est indisponible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92dvh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Studio d&apos;Images IA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Propulsé par Gemini Vision (gemini-3.1-flash-lite-image)
              </p>
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
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Transparent API Requirement Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold">Information API &amp; Facturation :</strong> La génération d&apos;images par Google Gemini (<span className="font-mono">gemini-3.1-flash-lite-image</span>) nécessite une clé API payante configurée dans <strong>Settings &gt; Secrets</strong>. En mode gratuit, aucun faux résultat n&apos;est généré.
              </div>
            </div>

            {/* Category */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Catégorie
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategory(c.id);
                      setAspectRatio(c.ratio);
                      setStyle(c.style);
                    }}
                    className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      category === c.id
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label
                htmlFor="img-prompt-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Description de l&apos;image
              </label>
              <textarea
                id="img-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex : Architecture moderne au bord du lac Tchad au lever du soleil, lumière naturelle, haute définition..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Style & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="img-style-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Style artistique
                </label>
                <select
                  id="img-style-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as ImageStyle)}
                  className="w-full min-h-[40px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {stylesList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Format
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`min-h-[40px] rounded-xl text-xs font-medium border tabular-nums cursor-pointer ${
                        aspectRatio === r
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/40 text-xs text-red-800 dark:text-red-200 space-y-1.5">
                <p className="font-semibold">
                  {requiresPaidKey ? 'Clé API payante requise' : 'Erreur de génération'}
                </p>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="h-52 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <span>Génération de l&apos;image avec Gemini Vision...</span>
              </div>
            )}

            {/* Generated Result */}
            {generatedImage && !isLoading && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
                  <img
                    src={generatedImage}
                    alt={prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-80 object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                    <Maximize2 className="w-4 h-4" />
                    <span>Agrandir</span>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {generatedModel} · {aspectRatio}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await shareImage(generatedImage, prompt);
                        if (res.success) {
                          setShareFeedback('Partagé');
                          setTimeout(() => setShareFeedback(null), 2000);
                        }
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {shareFeedback ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{shareFeedback || 'Partager'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImage(generatedImage, prompt)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onGenerated(generatedImage, prompt, category, style);
                        onClose();
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Ajouter au chat</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              SAMRY AI PRO MAX · Oumar Hassane Abdelkerim
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Génération...' : 'Générer l\'image'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isZoomed && generatedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={generatedImage}
            alt={prompt}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
          />
        </div>
      )}
    </>
  );
};
