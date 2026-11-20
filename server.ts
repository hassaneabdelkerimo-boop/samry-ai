import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  shouldTriggerWebSearch,
  performRealTimeWebSearch,
  formatSearchContextForPrompt,
  extractSiteName,
} from './server/webSearch.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Security & CORS headers (iframe-compatible)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Shared Gemini client initialized strictly server-side
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Economical free-tier-capable models (ordered from best capability to lightweight fallback)
const CHAT_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

const LANGUAGE_LABELS: Record<string, string> = {
  auto: 'Détection automatique (Français par défaut)',
  fr: 'Français',
  en: 'Anglais (English)',
  ar: 'Arabe littéraire (العربية)',
  es: 'Espagnol (Español)',
  de: 'Allemand (Deutsch)',
  it: 'Italien (Italiano)',
  pt: 'Portugais (Português)',
  zh: 'Chinois mandarin (中文)',
  ru: 'Russe (Русский)',
  tr: 'Turc (Türkçe)',
};

function buildSystemInstruction(mode?: string, language?: string): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const tomorrow = new Date(now.getTime() + 86400000);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });

  const currentTimeParis = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
  const currentTimeUtc = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  const yesterdayStr = fmtDate(yesterday);
  const todayDateStr = fmtDate(now);
  const tomorrowStr = fmtDate(tomorrow);

  const baseInstruction = `Tu es SAMRY AI PRO MAX, un assistant d'intelligence artificielle avancé, créé par Oumar Hassane Abdelkerim.

IDENTITÉ :
- Nom : SAMRY AI PRO MAX
- Créateur : Oumar Hassane Abdelkerim (mentionne-le clairement lorsqu'on te demande qui tu es ou qui t'a créé).
- Profil : Assistant IA multilingue, professionnel, rapide, précis et serviable. Français clair par défaut (sauf si l'utilisateur demande ou écrit dans une autre langue).

INSTRUCTIONS PRINCIPALES :
1. QUALITÉ DES RÉPONSES :
   - Réponds comme un assistant IA professionnel avec des réponses claires, précises, intelligentes et bien structurées (titres Markdown, listes, tableaux si utile).
   - Comprends parfaitement les questions même si elles contiennent des fautes d'orthographe ou d'inattention.
   - Va droit au but sans tourner autour du sujet ; évite les réponses trop longues et les répétitions.
   - Explique les notions difficiles avec des exemples simples et concrets.

2. ACTUALITÉS ET INFORMATIONS EN DIRECT :
   - Tu disposes d'une recherche Internet en temps réel intégrée au serveur (DuckDuckGo, Google Actualités, Bing Actualités, ESPN Live Scores, Wikipédia FR).
   - Lorsque des données Web en direct te sont fournies dans le message, vérifie les informations d'aujourd'hui, d'hier et des jours précédents, contrôle les dates et les sources, et ne dis JAMAIS que tu n'as pas accès à Internet.
   - Ne présente JAMAIS une ancienne information comme une actualité récente.
   - Ajoute des liens Markdown vers les sources consultées lorsque des URL réelles te sont fournies.
   - Si aucune recherche n'a été effectuée sur une requête donnée, ne prétends JAMAIS avoir effectué une recherche.

3. SPORTS ET FOOTBALL :
   - Lorsque des données ESPN/Web te sont fournies, présente les matchs d'aujourd'hui et de demain (ainsi que les résultats récents d'hier) avec les équipes, compétitions, horaires et scores en direct ou finaux.
   - Ne fabrique JAMAIS de matchs, d'horaires, de buteurs ou de résultats.

4. TOUTES LES CONNAISSANCES :
   - Sciences et médecine (avec rappel de consulter un professionnel de santé pour tout diagnostic ou traitement personnel).
   - Éducation et universités, mathématiques et physique (raisonnement étape par étape et vérification des calculs).
   - Histoire et géographie, économie et finances, actualités internationales.
   - Informatique, programmation et technologie / IA (code propre, typé, sécurisé et débogage rigoureux).
   - Langues et traduction multilingue fidèle ; rédaction et correction de lettres, CV, rapports et présentations.

5. IMAGES ET DOCUMENTS :
   - Analyse avec précision les images envoyées et lis/résume fidèlement les documents PDF et fichiers texte ou code.
   - Pour générer une image, indique le bouton « Studio d'Images IA » (qui nécessite une clé API Gemini avec facturation activée dans Settings > Secrets).

6. DATE ET HEURE ACTUELLES (DYNAMIQUES) :
   - Hier : ${yesterdayStr}
   - Aujourd'hui : ${todayDateStr}
   - Demain : ${tomorrowStr}
   - Heure actuelle : ${currentTimeParis} (heure de Paris/CET) · ${currentTimeUtc} UTC.
   - Distingue toujours clairement hier, aujourd'hui et demain ; ne suppose jamais une autre date.

7. HONNÊTETÉ ET PRÉCISION :
   - Ne mens jamais, ne crée jamais de fausses sources, ne fabrique jamais de données.
   - Si une information n'est pas vérifiable ou manque dans les résultats, explique honnêtement ce qui manque.

8. BASE DE DONNÉES COMPLÈTE OFFICIELLE — TOUT INTERNET VRAI (RÈGLE D'EXCLUSIVITÉ) :
   - RÈGLE ABSOLUE : Pour toute source Internet, fait d'actualité, information institutionnelle, score, bourse, visa, santé ou réseau social, SAMRY ne doit utiliser QUE les sites et comptes officiels listés ci-dessous (hors calculs mathématiques, code informatique, traductions, rédaction ou analyse des fichiers/images envoyés directement par l'utilisateur). Si une information externe ou un site ne figure pas dans cette liste officielle autorisée et n'est pas confirmé par la recherche officielle fournie, dis honnêtement « Je ne sais pas » sans jamais inventer ni citer d'autres sites.
   - 1. CANADA (VISA, ÉTUDES, IMMIGRATION) : canada.ca, ircc.canada.ca, canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html, .../travailler-canada.html, .../visiter-canada.html.
   - 2. BOURSES CANADA 100 % VRAIES : bcdi2030.ca, mccallmacbainscholars.org, mastercardfdn.org, mcgill.ca, utoronto.ca, ubc.ca, ulaval.ca, umontreal.ca, uottawa.ca, concordia.ca, scholarships.gc.ca.
   - 3. FOOTBALL (SCORES VRAIS) : uefa.com, fifa.com, espn.com, onefootball.com, livescore.com, flashscore.fr, sofascore.com, transfermarkt.com, footmercato.net.
   - 4. TCHAD (INFOS VRAIES & PLAQUES 01–22) : presidence.td, primature.td, sante.gouv.td, univ-ndjamena.com, tchadinfos.com, alwihdainfo.com, wikipedia.org (+ référentiel exact des 22 plaques du Tchad).
   - 5. NOUVELLES MONDE & AFRIQUE : rfi.fr, france24.com, bbc.com/afrique, jeuneafrique.com, lemonde.fr, aljazeera.com, apnews.com, reuters.com, africanews.com.
   - 6. SANTÉ & BIOLOGIE : who.int, pasteur.fr, sante.gouv.fr, nih.gov, cdc.gov, thelancet.com.
   - 7. SCIENCE & ÉTUDES : unesco.org, khanacademy.org, coursera.org, edx.org, sciencedirect.com, nature.com.
   - 8. EMPLOI, ONU & HUMANITAIRE : unv.org, jobs.un.org, reliefweb.int, unjobs.org, undp.org.
   - 9. RÉSEAUX SOCIAUX (SEULEMENT COMPTES OFFICIELS VÉRIFIÉS — COCHE BLEUE) :
     * Facebook : facebook.com/UEFA, facebook.com/FIFA, facebook.com/Canada, facebook.com/UniversiteMcGill, facebook.com/PresidenceTchad.
     * Instagram : instagram.com/uefa_official, instagram.com/fifa, instagram.com/portugal, instagram.com/cristiano (attention : Cristiano Ronaldo a pris sa retraite en 2026), instagram.com/canada, instagram.com/mcgillu.
     * X / Twitter : x.com/UEFA, x.com/FIFAcom, x.com/Canada, x.com/McGillU.
     * YouTube : youtube.com/@UEFA, youtube.com/@FIFA, youtube.com/@Canada, youtube.com/@RFI, youtube.com/@France24.
     * Threads : threads.net/@uefa_official, threads.net/@fifa.
     * TikTok : tiktok.com/@uefa, tiktok.com/@fifa.
     (Tout autre compte sur les réseaux sociaux sans coche bleue est non fiable.)
   - 10. SITES À NE JAMAIS CROIRE — ARNAQUES (à signaler immédiatement quand la question aborde ces sujets) :
     * Tout site qui demande de l'argent pour une bourse = ARNAQUE.
     * Tout site qui dit « Gagnez 1 million » = ARNAQUE.
     * Tout compte Facebook sans coche bleue qui dit « Bourse Canada » = ARNAQUE.
     * Tout WhatsApp qui demande de payer pour un visa = ARNAQUE.`;

  let modeSpecific = '';
  switch (mode) {
    case 'news':
      modeSpecific = `\n[MODE WEB DIRECT & ACTUALITÉS] Appuie-toi strictement sur les résultats de recherche Internet en direct fournis ci-dessous (actualités, scores ESPN, pages vérifiées). Cite les dates, horaires et liens sources exacts. Ne dis jamais que tu n'as pas accès à Internet et n'invente aucune information.`;
      break;
    case 'math':
      modeSpecific = `\n[MODE MATHÉMATIQUES] Rigueur mathématique absolue : pose les définitions/hypothèses, développe les équations étape par étape, vérifie le résultat final.`;
      break;
    case 'study':
      modeSpecific = `\n[MODE ÉTUDES & SCIENCES] Tuteur académique d'élite : vulgarise les concepts complexes, structure en plan logique, propose des exemples concrets et points clés à retenir.`;
      break;
    case 'medicine':
      modeSpecific = `\n[MODE MÉDECINE & SANTÉ] Approche médicale rigoureuse basée sur les connaissances scientifiques validées. Clarifie le vocabulaire clinique simplement et rappelle de consulter un professionnel de santé pour tout diagnostic ou traitement personnel.`;
      break;
    case 'code':
      modeSpecific = `\n[MODE CODE & INFORMATIQUE] Ingénieur logiciel senior : code propre, sécurisé, commenté si utile, gestion des erreurs complète et analyse claire des failles ou bugs corrigés.`;
      break;
    case 'writing':
      modeSpecific = `\n[MODE RÉDACTION & CORRECTION] Plume professionnelle irréprochable : orthographe, grammaire, style adapté (CV, lettre, rapport, e-mail, essai).`;
      break;
    case 'translate':
      modeSpecific = `\n[MODE TRADUCTION MULTILINGUE] Traducteur professionnel expert. Traduis avec fidélité, naturel et respect du contexte culturel. Si l'utilisateur ne précise pas la langue cible, traduis vers le français (ou vers l'anglais si le texte est déjà en français, sauf indication contraire).`;
      break;
    default:
      break;
  }

  let langInstruction = '';
  if (language && language !== 'auto') {
    const label = LANGUAGE_LABELS[language] || language;
    langInstruction = `\n[LANGUE DEMANDÉE] Réponds ou traduis en : ${label}.`;
  }

  return `${baseInstruction}${modeSpecific}${langInstruction}`;
}

function parseSiteName(url: string): string {
  return extractSiteName(url);
}

function buildPartsFromTurn(
  text: string,
  attachment: any,
  includeBinaryAttachment: boolean
): any[] {
  const parts: any[] = [];

  if (attachment) {
    if (attachment.textContent && typeof attachment.textContent === 'string') {
      const truncated = attachment.textContent.slice(0, 120000);
      parts.push({
        text: `[Fichier joint : ${attachment.name} (${attachment.mimeType || 'text/plain'})]\n\`\`\`\n${truncated}\n\`\`\``,
      });
    } else if (includeBinaryAttachment && attachment.base64 && attachment.mimeType) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.base64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    } else if (!includeBinaryAttachment && attachment.name) {
      parts.push({
        text: `[Pièce jointe précédente dans la discussion : ${attachment.name}]`,
      });
    }
  }

  const trimmedText = typeof text === 'string' ? text.trim() : '';
  if (trimmedText) {
    parts.push({ text: trimmedText });
  } else if (attachment) {
    if (attachment.type === 'pdf' || attachment.mimeType === 'application/pdf') {
      parts.push({
        text: 'Analyse attentivement ce document PDF et fournis un résumé structuré, complet et précis en français avec les points clés.',
      });
    } else if (attachment.type === 'image') {
      parts.push({
        text: 'Analyse en détail cette image et décris tout ce qui est important ou pertinent.',
      });
    } else {
      parts.push({
        text: 'Analyse ce fichier en détail, explique son contenu et signale toute anomalie ou point clé.',
      });
    }
  }

  return parts;
}

function formatGeminiContents(
  messages: any[],
  currentMessage?: string,
  attachment?: any,
  liveSearchContext?: string
): any[] {
  const rawTurns: { role: 'user' | 'model'; text: string; attachment?: any; isCurrent?: boolean }[] = [];

  if (Array.isArray(messages)) {
    // Keep up to the last 24 messages for context efficiency
    const recent = messages.slice(-24);
    for (let i = 0; i < recent.length; i++) {
      const msg = recent[i];
      if (!msg || msg.isError) continue;
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const text = typeof msg.text === 'string' ? msg.text.trim() : '';
      if (!text && !msg.attachment) continue;
      const isRecentAttachment = i >= recent.length - 4;
      rawTurns.push({
        role,
        text,
        attachment: msg.attachment,
        isCurrent: isRecentAttachment,
      });
    }
  }

  if (currentMessage || attachment) {
    const trimmedCurrent = currentMessage ? currentMessage.trim() : '';
    const enrichedUserText = liveSearchContext
      ? `${trimmedCurrent}\n\n${liveSearchContext}`
      : trimmedCurrent;
    rawTurns.push({
      role: 'user',
      text: enrichedUserText,
      attachment,
      isCurrent: true,
    });
  }

  const contents: any[] = [];
  let lastRole: 'user' | 'model' | null = null;

  for (const turn of rawTurns) {
    const parts = buildPartsFromTurn(turn.text, turn.attachment, Boolean(turn.isCurrent));
    if (parts.length === 0) continue;

    if (contents.length === 0) {
      if (turn.role !== 'user') {
        contents.push({ role: 'user', parts: [{ text: 'Bonjour SAMRY AI PRO MAX.' }] });
      }
      contents.push({ role: turn.role, parts });
      lastRole = turn.role;
    } else if (turn.role === lastRole) {
      contents[contents.length - 1].parts.push(...parts);
    } else {
      contents.push({ role: turn.role, parts });
      lastRole = turn.role;
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage || 'Bonjour SAMRY AI PRO MAX.' }],
    });
  }

  return contents;
}

function mapThinkingDepth(depth?: string, mode?: string): ThinkingLevel {
  if (depth === 'low') return ThinkingLevel.LOW;
  if (depth === 'high') return ThinkingLevel.HIGH;
  if (depth === 'medium') return ThinkingLevel.MEDIUM;

  // Smart default by mode
  if (mode === 'math' || mode === 'code' || mode === 'medicine' || mode === 'study') {
    return ThinkingLevel.HIGH;
  }
  return ThinkingLevel.MEDIUM;
}

function formatFrenchGeminiError(err: any): { status: number; message: string; requiresPaidKey?: boolean } {
  const errStr = (err?.message || String(err || '')).toLowerCase();
  const status = err?.status || err?.statusCode || 500;

  if (errStr.includes('missing_api_key')) {
    return {
      status: 500,
      message:
        'Aucune clé API Gemini n\'est configurée côté serveur. Veuillez ajouter GEMINI_API_KEY dans le panneau Settings > Secrets.',
    };
  }
  if (status === 403 || errStr.includes('permission_denied') || errStr.includes('api_key_invalid') || errStr.includes('api key')) {
    return {
      status: 403,
      message:
        'La clé API Gemini est invalide ou ne dispose pas des autorisations requises. Vérifiez votre clé dans Settings > Secrets.',
      requiresPaidKey: true,
    };
  }
  if (status === 429 || errStr.includes('resource_exhausted') || errStr.includes('quota')) {
    return {
      status: 429,
      message:
        'Le quota de requêtes gratuites est temporairement atteint (Erreur 429). Patientez quelques secondes ou activez la facturation dans Settings > Secrets.',
      requiresPaidKey: true,
    };
  }
  if (status === 404 || errStr.includes('not_found')) {
    return {
      status: 404,
      message: 'Le modèle demandé est indisponible pour cette clé API.',
    };
  }
  if (status === 503 || errStr.includes('unavailable') || errStr.includes('high demand')) {
    return {
      status: 503,
      message: 'Les serveurs Google Gemini sont momentanément surchargés. Veuillez réessayer dans un instant.',
    };
  }

  return {
    status: 500,
    message: 'Une erreur technique est survenue lors de la communication avec Gemini. Veuillez réessayer.',
  };
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
  res.json({
    status: 'ok',
    app: 'SAMRY AI PRO MAX',
    creator: 'Oumar Hassane Abdelkerim',
    hasApiKey: hasKey,
    defaultModel: 'gemini-4-hydrogen',
    fallbackModel: 'gemini-3.1-flash-lite',
    timestamp: new Date().toISOString(),
  });
});

// Live Web Search Endpoint (direct test/lookup)
app.get('/api/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      res.status(400).json({ error: 'Paramètre q requis.' });
      return;
    }
    const output = await performRealTimeWebSearch(q);
    res.json(output);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur de recherche Web.' });
  }
});

// Streaming Chat Endpoint (SSE) with Real-Time Web Search + Gemini 4 Hydrogen
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(': connected\n\n');

  let clientClosed = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientClosed = true;
    }
  });

  const sendEvent = (payload: any) => {
    if (clientClosed || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const { messages, currentMessage, mode, language, attachment, webSearch, thinkingDepth } = req.body;

    if (!currentMessage && !attachment) {
      sendEvent({ type: 'error', error: 'Un message ou un fichier est requis.' });
      res.end();
      return;
    }

    const ai = getGeminiClient();
    const needSearch = shouldTriggerWebSearch(currentMessage || '', mode, Boolean(webSearch));
    const systemInstruction = buildSystemInstruction(mode, language);
    const thinkingLevel = mapThinkingDepth(thinkingDepth, mode);

    let liveSearchContext: string | undefined;
    let webSources: Array<{ title: string; url: string; siteName: string }> = [];
    let enginesUsed: string[] = [];

    if (needSearch && currentMessage) {
      sendEvent({
        type: 'status',
        model: CHAT_MODELS[0],
        searching: true,
        searchPhase: 'Recherche en temps réel sur Internet...',
      });

      const searchOutput = await performRealTimeWebSearch(currentMessage, { mode });
      liveSearchContext = formatSearchContextForPrompt(searchOutput);
      enginesUsed = searchOutput.enginesUsed;
      webSources = searchOutput.results.slice(0, 6).map((r) => ({
        title: r.title,
        url: r.url,
        siteName: r.siteName,
      }));
      console.log(
        `[SAMRY AI PRO MAX] Recherche Web terminée | Moteurs: ${enginesUsed.join(', ') || 'aucun'} | Sources: ${webSources.length}`
      );
    }

    const contents = formatGeminiContents(messages, currentMessage, attachment, liveSearchContext);

    let lastError: any = null;
    let succeeded = false;

    for (const modelName of CHAT_MODELS) {
      if (clientClosed) break;
      try {
        const config: any = {
          systemInstruction,
        };

        if (modelName === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel };
        }

        sendEvent({
          type: 'status',
          model: modelName,
          searching: needSearch,
          enginesUsed,
        });

        console.log(`[SAMRY AI PRO MAX] Stream démarré avec ${modelName} | Mode: ${mode} | Web: ${needSearch}`);

        const stream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config,
        });

        let receivedAnyText = false;

        for await (const chunk of stream) {
          if (clientClosed) break;

          const chunkText = chunk?.text;
          if (chunkText) {
            receivedAnyText = true;
            sendEvent({ type: 'chunk', text: chunkText });
          }
        }

        if (receivedAnyText) {
          sendEvent({
            type: 'done',
            model: modelName,
            isGrounded: needSearch && (webSources.length > 0 || enginesUsed.length > 0),
            sources: webSources,
            enginesUsed,
          });
          succeeded = true;
          console.log(`[SAMRY AI PRO MAX] Stream terminé avec succès (${modelName})`);
          break;
        } else {
          lastError = new Error('EMPTY_STREAM_RESPONSE');
          console.warn(`[SAMRY AI PRO MAX] Stream vide avec ${modelName}`);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[SAMRY AI PRO MAX] Échec stream ${modelName}:`, err?.message?.slice(0, 200));
        const status = err?.status || err?.statusCode;
        if (status === 400 || status === 403) {
          break;
        }
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    if (!succeeded && !clientClosed) {
      const formatted = formatFrenchGeminiError(lastError);
      sendEvent({
        type: 'error',
        error: formatted.message,
        requiresPaidKey: Boolean(formatted.requiresPaidKey),
      });
    }
  } catch (fatalErr: any) {
    console.error('[SAMRY AI PRO MAX] Erreur stream:', fatalErr);
    const formatted = formatFrenchGeminiError(fatalErr);
    sendEvent({
      type: 'error',
      error: formatted.message,
      requiresPaidKey: Boolean(formatted.requiresPaidKey),
    });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

// Non-streaming JSON Chat fallback endpoint
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, currentMessage, mode, language, attachment, webSearch, thinkingDepth } = req.body;

    if (!currentMessage && !attachment) {
      res.status(400).json({ error: 'Message ou fichier requis.' });
      return;
    }

    const ai = getGeminiClient();
    const needSearch = shouldTriggerWebSearch(currentMessage || '', mode, Boolean(webSearch));
    const systemInstruction = buildSystemInstruction(mode, language);
    const thinkingLevel = mapThinkingDepth(thinkingDepth, mode);

    let liveSearchContext: string | undefined;
    let webSources: Array<{ title: string; url: string; siteName: string }> = [];
    let enginesUsed: string[] = [];

    if (needSearch && currentMessage) {
      const searchOutput = await performRealTimeWebSearch(currentMessage, { mode });
      liveSearchContext = formatSearchContextForPrompt(searchOutput);
      enginesUsed = searchOutput.enginesUsed;
      webSources = searchOutput.results.slice(0, 6).map((r) => ({
        title: r.title,
        url: r.url,
        siteName: r.siteName,
      }));
    }

    const contents = formatGeminiContents(messages, currentMessage, attachment, liveSearchContext);

    let lastError: any = null;

    for (const modelName of CHAT_MODELS) {
      try {
        const config: any = { systemInstruction };
        if (modelName === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel };
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });

        const replyText = response?.text?.trim();
        if (replyText) {
          res.json({
            reply: replyText,
            model: modelName,
            creator: 'Oumar Hassane Abdelkerim',
            isGrounded: needSearch && (webSources.length > 0 || enginesUsed.length > 0),
            sources: webSources,
            enginesUsed,
          });
          return;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[SAMRY AI PRO MAX] Échec ${modelName}:`, err?.message?.slice(0, 160));
        const status = err?.status || err?.statusCode;
        if (status === 400 || status === 403) break;
      }
    }

    const formatted = formatFrenchGeminiError(lastError);
    res.status(formatted.status).json({
      error: formatted.message,
      requiresPaidKey: Boolean(formatted.requiresPaidKey),
      creator: 'Oumar Hassane Abdelkerim',
    });
  } catch (fatalError: any) {
    console.error('[SAMRY AI PRO MAX] Erreur /api/chat:', fatalError);
    const formatted = formatFrenchGeminiError(fatalError);
    res.status(formatted.status).json({
      error: formatted.message,
      requiresPaidKey: Boolean(formatted.requiresPaidKey),
      creator: 'Oumar Hassane Abdelkerim',
    });
  }
});

// Enriched prompt builder for Gemini image models
function buildEnrichedImagePrompt(prompt: string, category?: string, style?: string): string {
  const clean = prompt.trim();
  const categoryHints: Record<string, string> = {
    portrait: 'Portrait studio professionnel, visage expressif, détails nets, éclairage maîtrisé',
    landscape: 'Paysage panoramique spectaculaire, lumière naturelle riche, composition équilibrée',
    poster: 'Affiche graphique moderne, composition audacieuse, design éditorial soigné',
    logo: 'Logo vectoriel minimaliste et épuré, emblème mémorable sur fond uni propre',
    free: 'Composition visuelle soignée, couleurs équilibrées, netteté élevée',
  };
  const styleHints: Record<string, string> = {
    photorealistic: 'photographie réaliste haute définition, textures naturelles, éclairage studio',
    cinematic: 'esthétique cinématographique, éclairage dramatique, profondeur de champ',
    '3d_render': 'rendu 3D précis, matériaux réalistes, reflets doux',
    digital_art: 'art numérique soigné, palette harmonieuse',
    anime: 'style animation japonaise moderne, traits nets',
    vector_logo: 'design vectoriel plat minimaliste',
    typography_poster: 'affiche graphique moderne à fort contraste',
    oil_painting: 'peinture à l\'huile classique sur toile, touches texturées',
  };

  return `${clean}. ${categoryHints[category || 'free'] || categoryHints.free}. Style : ${styleHints[style || 'photorealistic'] || styleHints.photorealistic}.`;
}

// Honest Image Generation Endpoint (Gemini Vision Models ONLY - NO fake fallbacks)
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, aspectRatio = '1:1', style = 'photorealistic', category = 'free', quality = 'standard' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Une description est requise pour générer une image.' });
      return;
    }

    const ai = getGeminiClient();
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const targetRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    const enrichedPrompt = buildEnrichedImagePrompt(prompt, category, style);
    const modelName = quality === 'hd' ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite-image';

    const config: any = {
      imageConfig: {
        aspectRatio: targetRatio,
        ...(quality === 'hd' ? { imageSize: '2K' } : {}),
      },
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: enrichedPrompt }] },
      config,
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        res.json({
          imageUrl: `data:${mime};base64,${part.inlineData.data}`,
          prompt,
          category,
          style,
          aspectRatio: targetRatio,
          modelUsed: modelName,
          creator: 'Oumar Hassane Abdelkerim',
          timestamp: Date.now(),
        });
        return;
      }
    }

    res.status(502).json({
      error: 'Le modèle n\'a retourné aucune image pour cette description. Essayez de reformuler votre demande.',
    });
  } catch (err: any) {
    console.warn('[SAMRY AI Image] Erreur:', err?.message?.slice(0, 180));
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.statusCode || 500;

    if (
      status === 400 ||
      status === 403 ||
      status === 429 ||
      msg.includes('billing') ||
      msg.includes('paid') ||
      msg.includes('quota') ||
      msg.includes('permission_denied') ||
      msg.includes('resource_exhausted')
    ) {
      res.status(402).json({
        requiresPaidKey: true,
        error:
          'La génération d\'images IA (gemini-3.1-flash-lite-image / gemini-nano-banana-2.1) nécessite une clé API Google Gemini avec facturation activée dans Settings > Secrets. Aucune image factice n\'a été générée.',
      });
      return;
    }

    const formatted = formatFrenchGeminiError(err);
    res.status(formatted.status).json({
      error: formatted.message,
      requiresPaidKey: Boolean(formatted.requiresPaidKey),
    });
  }
});

// Direct Image Download Proxy (only for valid URLs or data URIs)
app.get('/api/download-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const imageUrl = req.query.url as string;
    const customName = ((req.query.filename as string) || `SAMRY_AI_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!imageUrl) {
      res.status(400).send('URL requise.');
      return;
    }

    if (imageUrl.startsWith('data:image/')) {
      const matches = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${customName}.${ext}"`);
        res.send(buffer);
        return;
      }
    }

    res.status(400).send('Format d\'image non supporté.');
  } catch (err: any) {
    console.error('[SAMRY AI] Erreur téléchargement:', err?.message);
    res.status(500).send('Erreur lors du téléchargement.');
  }
});

// Vite middleware in dev, static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAMRY AI PRO MAX démarré sur http://0.0.0.0:${PORT}`);
    console.log(`Créateur : Oumar Hassane Abdelkerim`);
  });
}

startServer().catch((err) => {
  console.error('Échec du démarrage du serveur:', err);
});
