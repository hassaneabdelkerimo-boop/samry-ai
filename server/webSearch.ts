import {
  detectOfficialCategories,
  isAllowedOfficialUrl,
  lookupChadPlateInfo,
  OFFICIAL_CANADA_IMMIGRATION_SITES,
  OFFICIAL_CANADA_SCHOLARSHIP_SITES,
  OFFICIAL_FOOTBALL_SITES,
  OFFICIAL_CHAD_SITES,
  OFFICIAL_AFRICA_WORLD_NEWS_FEEDS,
  OFFICIAL_HEALTH_BIOLOGY_SITES,
  OFFICIAL_SCIENCE_EDUCATION_SITES,
  OFFICIAL_UN_JOBS_SITES,
  OFFICIAL_SOCIAL_VERIFIED_SITES,
  OfficialCategory,
} from './officialDatabase.ts';

export interface WebSearchResultItem {
  title: string;
  url: string;
  siteName: string;
  snippet: string;
  publishedAt?: string;
  publishedTimestamp?: number;
  freshnessLabel?: string;
  sourceType: 'web' | 'news' | 'sports' | 'wiki' | 'official';
}

export interface RealTimeWebSearchOutput {
  query: string;
  executedAt: string;
  todayLabel: string;
  yesterdayLabel: string;
  tomorrowLabel: string;
  categories: OfficialCategory[];
  chadPlateDossier?: string | null;
  officialGuidance?: string[];
  results: WebSearchResultItem[];
  pageExcerpts: Array<{ title: string; url: string; siteName: string; excerpt: string }>;
  sportsMatches: string[];
  enginesUsed: string[];
}

function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  const str = input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&acirc;/g, 'â')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&iuml;/g, 'ï')
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCharCode(n) : '';
    });

  return str.replace(/\s+/g, ' ').trim();
}

export function extractSiteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(?:www|m|fr)\./, '');
  } catch {
    return 'Source Web';
  }
}

function formatYyyymmdd(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatFrenchDate(d: Date, timeZone = 'Europe/Paris'): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

function getFreshnessInfo(pubDateStr?: string): { timestamp?: number; label?: string } {
  if (!pubDateStr) return {};
  const ts = Date.parse(pubDateStr);
  if (!Number.isFinite(ts)) return {};

  const now = new Date();
  const d = new Date(ts);
  const diffHours = (now.getTime() - ts) / 3600000;

  const sameParisDay = (a: Date, b: Date) =>
    a.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) ===
    b.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });

  const yesterday = new Date(now.getTime() - 86400000);

  if (diffHours >= -2 && sameParisDay(d, now)) {
    return { timestamp: ts, label: "Aujourd'hui" };
  }
  if (sameParisDay(d, yesterday)) {
    return { timestamp: ts, label: 'Hier' };
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 0 && diffDays <= 7) {
    return { timestamp: ts, label: `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}` };
  }
  return {
    timestamp: ts,
    label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export function shouldTriggerWebSearch(
  query: string,
  mode?: string,
  explicitWebSearch?: boolean
): boolean {
  if (explicitWebSearch || mode === 'news') return true;
  if (!query || typeof query !== 'string') return false;

  const q = query.toLowerCase().trim();
  if (q.length < 3) return false;

  if (
    /^(?:bonjour|salut|coucou|hello|hi|salam|bonsoir|merci|ça va|qui es-tu|présente-toi)[\s\w!?.–—']*$/i.test(
      q
    )
  ) {
    return false;
  }

  if (detectOfficialCategories(q, mode).length > 0) {
    return true;
  }

  const explicitSearchAsk =
    /\b(?:recherche|cherche|vérifie|actualité|actualités|aujourd'hui|hier|demain|dernière minute|en direct|score|match|matchs|résultat|classement)\b/i.test(
      q
    );
  if (
    (mode === 'math' || mode === 'code' || mode === 'translate' || mode === 'writing') &&
    !explicitSearchAsk
  ) {
    return false;
  }

  const realTimeKeywords = [
    'actualité',
    'actualités',
    'actu ',
    'info du jour',
    'dernière minute',
    'dernières nouvelles',
    'nouvelles récentes',
    'récemment',
    'aujourd\'hui',
    'aujourd hui',
    'hier',
    'demain',
    'cette semaine',
    'ce week-end',
    'ce weekend',
    'ce mois',
    'en 2026',
    '2026',
    '2027',
    'dernier match',
    'prochain match',
    'match de',
    'match du',
    'matchs',
    'score',
    'scores',
    'en direct',
    'résultat',
    'résultats',
    'classement',
    'ligue des champions',
    'champions league',
    'ligue des nations',
    'nations league',
    'ligue 1',
    'premier league',
    'la liga',
    'serie a',
    'bundesliga',
    'coupe du monde',
    'ballon d\'or',
    'football',
    'foot',
    'psg',
    'real madrid',
    'barcelone',
    'barça',
    'arsenal',
    'liverpool',
    'manchester',
    'bayern',
    'juventus',
    'marseille',
    'équipe de france',
    'nba',
    'formule 1',
    'roland-garros',
    'météo',
    'taux de change',
    'cours du',
    'prix du',
    'bitcoin',
    'crypto',
    'bourse',
    'élection',
    'président',
    'gouvernement',
    'prix nobel',
    'découverte scientifique',
    'nasa',
    'spacex',
    'sortie de',
    'dernière version',
    'cherche sur internet',
    'recherche sur internet',
    'recherche web',
    'sur google',
  ];

  return realTimeKeywords.some((kw) => q.includes(kw));
}

function buildSearchQuery(rawQuery: string): string {
  const cleaned = rawQuery
    .replace(
      /^(?:peux-tu|pouvez-vous|dis-moi|cherche|recherche|donne-moi|quels sont|quelles sont|quel est|quelle est)\s+/i,
      ''
    )
    .trim();
  return (cleaned || rawQuery).slice(0, 180);
}

async function searchDuckDuckGo(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const results: WebSearchResultItem[] = [];
    const blockRegex =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    let match: RegExpExecArray | null;
    while ((match = blockRegex.exec(html)) !== null && results.length < 6) {
      let rawUrl = match[1];
      if (rawUrl.includes('duckduckgo.com/y.js') || rawUrl.includes('ad_provider')) {
        continue;
      }
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        try {
          rawUrl = decodeURIComponent(uddgMatch[1]);
        } catch {
          // Keep original
        }
      } else if (rawUrl.startsWith('//')) {
        rawUrl = `https:${rawUrl}`;
      }

      if (!rawUrl.startsWith('http')) continue;
      if (!isAllowedOfficialUrl(rawUrl)) continue;

      const title = decodeHtmlEntities(match[2]);
      const snippet = decodeHtmlEntities(match[3]);
      if (!title || !snippet) continue;

      results.push({
        title,
        url: rawUrl,
        siteName: extractSiteName(rawUrl),
        snippet,
        sourceType: 'web',
      });
    }

    return results;
  } catch (err: any) {
    console.warn('[SAMRY WebSearch] DDG error:', err?.message);
    return [];
  }
}

async function searchGoogleNewsRss(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SamryAI/1.0)',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const results: WebSearchResultItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null && results.length < 12) {
      const itemXml = match[1];
      const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const rawLink = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const rawPubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const rawSourceTag = (itemXml.match(/<source([^>]*)>([\s\S]*?)<\/source>/) || []);
      const sourceAttrs = rawSourceTag[1] || '';
      const rawSource = rawSourceTag[2] || '';
      const sourceUrlMatch = sourceAttrs.match(/url=["']([^"']+)["']/i);
      const publisherUrl = sourceUrlMatch ? decodeHtmlEntities(sourceUrlMatch[1]) : '';
      const rawDesc = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';

      const title = decodeHtmlEntities(rawTitle);
      const link = decodeHtmlEntities(rawLink);
      const sourceName = decodeHtmlEntities(rawSource) || 'Google Actualités';
      const snippet = decodeHtmlEntities(rawDesc) || title;

      if (!title || !link.startsWith('http')) continue;
      // Strict allowlist: only accept Google News items whose publisher <source url="..."> is in our official allowlist
      if (!publisherUrl || !isAllowedOfficialUrl(publisherUrl)) continue;

      const freshness = getFreshnessInfo(rawPubDate);

      results.push({
        title,
        url: link,
        siteName: sourceName,
        snippet,
        publishedAt: rawPubDate ? rawPubDate.trim() : undefined,
        publishedTimestamp: freshness.timestamp,
        freshnessLabel: freshness.label,
        sourceType: 'news',
      });
    }

    // Sort newest first so current news always wins over older indexed articles
    results.sort((a, b) => (b.publishedTimestamp || 0) - (a.publishedTimestamp || 0));
    return results.slice(0, 6);
  } catch (err: any) {
    console.warn('[SAMRY WebSearch] Google News RSS error:', err?.message);
    return [];
  }
}

async function searchBingNewsRss(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(
      query
    )}&format=rss&mkt=fr-FR`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SamryAI/1.0)',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const results: WebSearchResultItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const sixtyDaysAgo = Date.now() - 60 * 86400000;

    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null && results.length < 10) {
      const itemXml = match[1];
      const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const rawLink = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const rawPubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const rawDesc = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';

      let link = decodeHtmlEntities(rawLink);
      const urlParam = link.match(/[?&]url=([^&]+)/);
      if (urlParam) {
        try {
          link = decodeURIComponent(urlParam[1]);
        } catch {
          // Keep original
        }
      }

      const title = decodeHtmlEntities(rawTitle);
      const snippet = decodeHtmlEntities(rawDesc);
      if (!title || !link.startsWith('http')) continue;
      if (!isAllowedOfficialUrl(link)) continue;

      const freshness = getFreshnessInfo(rawPubDate);
      // Skip obviously stale cached items older than 60 days
      if (freshness.timestamp && freshness.timestamp < sixtyDaysAgo) {
        continue;
      }

      results.push({
        title,
        url: link,
        siteName: extractSiteName(link),
        snippet: snippet || title,
        publishedAt: rawPubDate ? rawPubDate.trim() : undefined,
        publishedTimestamp: freshness.timestamp,
        freshnessLabel: freshness.label,
        sourceType: 'news',
      });
    }

    results.sort((a, b) => (b.publishedTimestamp || 0) - (a.publishedTimestamp || 0));
    return results.slice(0, 5);
  } catch (err: any) {
    console.warn('[SAMRY WebSearch] Bing News RSS error:', err?.message);
    return [];
  }
}

function isSportsQuery(query: string): boolean {
  const q = query.toLowerCase();
  return /\b(?:foot|football|match|matchs|score|scores|résultat|résultats|ligue|champions|nations|premier league|liga|serie a|bundesliga|psg|paris|real madrid|barcelone|barça|arsenal|liverpool|manchester|chelsea|bayern|juventus|milan|inter|marseille|lyon|monaco|lille|can|coupe du monde|ballon d'or|nba|basket|but|buteur|équipe de france|sélection)\b/i.test(
    q
  );
}

interface LeagueSpec {
  sport: string;
  league: string;
  label: string;
  url: string;
}

function selectEspnLeagues(query: string): LeagueSpec[] {
  const q = query.toLowerCase();
  const selected: LeagueSpec[] = [];
  const pushLeague = (spec: LeagueSpec) => {
    if (!selected.some((s) => s.league === spec.league && s.sport === spec.sport)) {
      selected.push(spec);
    }
  };

  if (/\b(?:nations|sélection|france|espagne|allemagne|portugal|italie|angleterre|amical|amicaux|international)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'uefa.nations',
      label: 'UEFA Nations League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/uefa.nations',
    });
    pushLeague({
      sport: 'soccer',
      league: 'fifa.friendly',
      label: 'Matchs internationaux FIFA',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/fifa.friendly',
    });
  }
  if (/\b(?:champions|ucl|c1)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'uefa.champions',
      label: 'UEFA Champions League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/uefa.champions',
    });
  }
  if (/\b(?:ligue 1|psg|paris|om|marseille|lyon|monaco|lille|rennes|lens|nice)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'fra.1',
      label: 'Ligue 1',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/fra.1',
    });
  }
  if (/\b(?:liga|real madrid|barcelone|barça|atletico|séville|betis)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'esp.1',
      label: 'La Liga',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/esp.1',
    });
  }
  if (/\b(?:premier league|arsenal|liverpool|manchester|chelsea|tottenham|city)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'eng.1',
      label: 'Premier League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/eng.1',
    });
  }
  if (/\b(?:serie a|juventus|inter|milan|napoli|naples|roma|lazio)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'ita.1',
      label: 'Serie A',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/ita.1',
    });
  }
  if (/\b(?:bundesliga|bayern|dortmund|leverkusen|leipzig)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'ger.1',
      label: 'Bundesliga',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/ger.1',
    });
  }
  if (/\b(?:can|afcon|caf|sénégal|maroc|algérie|égypte|cameroun|côte d'ivoire|tchad)\b/i.test(q)) {
    pushLeague({
      sport: 'soccer',
      league: 'caf.nations',
      label: 'CAN / CAF',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/caf.nations',
    });
  }
  if (/\b(?:nba|basket|basketball|lakers|celtics|warriors)\b/i.test(q)) {
    pushLeague({
      sport: 'basketball',
      league: 'nba',
      label: 'NBA',
      url: 'https://www.espn.com/nba/scoreboard',
    });
  }

  // Generic football query (e.g. "matchs d'aujourd'hui et de demain"): cover international + top club leagues
  if (selected.length === 0) {
    pushLeague({
      sport: 'soccer',
      league: 'uefa.nations',
      label: 'UEFA Nations League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/uefa.nations',
    });
    pushLeague({
      sport: 'soccer',
      league: 'fifa.friendly',
      label: 'Matchs internationaux FIFA',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/fifa.friendly',
    });
    pushLeague({
      sport: 'soccer',
      league: 'uefa.champions',
      label: 'UEFA Champions League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/uefa.champions',
    });
    pushLeague({
      sport: 'soccer',
      league: 'fra.1',
      label: 'Ligue 1',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/fra.1',
    });
    pushLeague({
      sport: 'soccer',
      league: 'eng.1',
      label: 'Premier League',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/eng.1',
    });
    pushLeague({
      sport: 'soccer',
      league: 'esp.1',
      label: 'La Liga',
      url: 'https://www.espn.com/soccer/scoreboard/_/league/esp.1',
    });
  }

  return selected.slice(0, 6);
}

function getRelativeDayTag(eventDate: Date, now: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
  const evDay = fmt(eventDate);
  const today = fmt(now);
  const yesterday = fmt(new Date(now.getTime() - 86400000));
  const tomorrow = fmt(new Date(now.getTime() + 86400000));

  if (evDay === today) return "AUJOURD'HUI";
  if (evDay === tomorrow) return 'DEMAIN';
  if (evDay === yesterday) return 'HIER';
  return evDay;
}

function formatFrenchKickoffTime(eventDate: Date): string {
  const parisTime = eventDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
  const utcTime = eventDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${parisTime} (Paris/CET, ${utcTime} UTC)`;
}

function translateStatus(statusDesc: string, state?: string): string {
  if (state === 'in') return `EN DIRECT (${statusDesc})`;
  if (state === 'post') return 'Terminé';
  if (state === 'pre') return 'À venir';
  return statusDesc || 'Programmé';
}

async function fetchEspnLiveScores(query: string): Promise<{
  matches: string[];
  sources: WebSearchResultItem[];
}> {
  if (!isSportsQuery(query)) {
    return { matches: [], sources: [] };
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const tomorrow = new Date(now.getTime() + 86400000);
  const q = query.toLowerCase();

  const wantsTomorrow = /\b(?:demain|prochain|prochains|calendrier|programme|week-end|weekend|semaine)\b/i.test(q) ||
    /\b(?:aujourd'hui|match|matchs)\b/i.test(q);
  const wantsYesterday = /\b(?:hier|dernier|derniers|récents)\b/i.test(q);

  const dateQueries: Array<{ tag: string; param: string }> = [{ tag: 'today', param: '' }];
  if (wantsTomorrow) {
    dateQueries.push({ tag: 'tomorrow', param: `?dates=${formatYyyymmdd(tomorrow)}` });
  }
  if (wantsYesterday) {
    dateQueries.push({ tag: 'yesterday', param: `?dates=${formatYyyymmdd(yesterday)}` });
  }

  const leagues = selectEspnLeagues(query);
  const matches: string[] = [];
  const seenEventIds = new Set<string>();
  const sources: WebSearchResultItem[] = [];
  const seenLeagueSources = new Set<string>();

  await Promise.all(
    leagues.flatMap((lg) =>
      dateQueries.map(async (dq) => {
        try {
          const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${lg.sport}/${lg.league}/scoreboard${dq.param}`;
          const res = await fetch(apiUrl, { signal: AbortSignal.timeout(4000) });
          if (!res.ok) return;
          const data: any = await res.json();
          const events = Array.isArray(data?.events) ? data.events : [];
          if (events.length === 0) return;

          let addedForLeague = 0;
          for (const ev of events.slice(0, 8)) {
            const evKey = `${lg.league}-${ev.id || ev.name}`;
            if (seenEventIds.has(evKey)) continue;
            seenEventIds.add(evKey);

            const comp = ev.competitions?.[0];
            const competitors = comp?.competitors || [];
            if (competitors.length < 2) continue;

            const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
            const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

            const evDate = ev.date ? new Date(ev.date) : null;
            const dayTag = evDate ? getRelativeDayTag(evDate, now) : '';
            const exactDate = evDate
              ? evDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
              : '';
            const kickoff = evDate ? formatFrenchKickoffTime(evDate) : '';
            const state = ev.status?.type?.state;
            const statusFr = translateStatus(
              ev.status?.type?.shortDetail || ev.status?.type?.description || '',
              state
            );

            const homeName = home.team?.displayName || home.team?.shortDisplayName || 'Domicile';
            const awayName = away.team?.displayName || away.team?.shortDisplayName || 'Extérieur';
            const homeScore = home.score ?? '-';
            const awayScore = away.score ?? '-';

            const scoreOrFixture =
              state === 'post' || state === 'in'
                ? `${homeName} ${homeScore} - ${awayScore} ${awayName}`
                : `${homeName} vs ${awayName} (Coup d'envoi : ${kickoff})`;

            matches.push(
              `[${dayTag} · ${exactDate} · ${lg.label}] ${scoreOrFixture} — Statut : ${statusFr}`
            );
            addedForLeague++;
          }

          if (addedForLeague > 0 && !seenLeagueSources.has(lg.url)) {
            seenLeagueSources.add(lg.url);
            sources.push({
              title: `Scores et calendrier en direct - ${lg.label}`,
              url: lg.url,
              siteName: 'ESPN Sports',
              snippet: `Matchs et horaires officiels récupérés en direct pour ${lg.label}.`,
              sourceType: 'sports',
            });
          }
        } catch {
          // Ignore single query failure
        }
      })
    )
  );

  // Prioritize today & tomorrow matches first
  matches.sort((a, b) => {
    const rank = (s: string) =>
      s.startsWith("[AUJOURD'HUI") ? 0 : s.startsWith('[DEMAIN') ? 1 : s.startsWith('[HIER') ? 2 : 3;
    return rank(a) - rank(b);
  });

  return { matches, sources };
}

async function searchWikipediaFr(query: string): Promise<WebSearchResultItem[]> {
  try {
    const url = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&srlimit=2&utf8=1`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: { 'User-Agent': 'SamryAIProMax/1.0' },
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const items = data?.query?.search;
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => {
      const slug = encodeURIComponent(String(item.title || '').replace(/\s+/g, '_'));
      return {
        title: String(item.title || ''),
        url: `https://fr.wikipedia.org/wiki/${slug}`,
        siteName: 'fr.wikipedia.org',
        snippet: decodeHtmlEntities(String(item.snippet || '')),
        sourceType: 'wiki' as const,
      };
    });
  } catch {
    return [];
  }
}

async function fetchPageExcerpt(url: string): Promise<string | null> {
  try {
    if (url.includes('news.google.com/rss/articles')) return null;
    if (!isAllowedOfficialUrl(url)) return null;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const html = await res.text();
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

    const text = decodeHtmlEntities(cleaned);
    if (text.length < 180) return null;
    return text.slice(0, 2600);
  } catch {
    return null;
  }
}

async function fetchOfficialRssFeeds(
  query: string,
  includeChadSpecific: boolean
): Promise<{ items: WebSearchResultItem[]; feedsHit: string[] }> {
  const feedsToQuery = OFFICIAL_AFRICA_WORLD_NEWS_FEEDS.filter(
    (f) => includeChadSpecific || f.name !== 'Tchadinfos' || /tchad|ndjamena|n'djamena/i.test(query)
  );
  // If Tchadinfos wasn't filtered out or if general Africa news, keep all 4 for comprehensive coverage
  const selectedFeeds = feedsToQuery.length >= 3 ? feedsToQuery : OFFICIAL_AFRICA_WORLD_NEWS_FEEDS;

  const keywords = query
    .toLowerCase()
    .split(/[^a-zàâéèêîïôûùç0-9]+/i)
    .filter((w) => w.length >= 4);

  const collected: WebSearchResultItem[] = [];
  const feedsHit: string[] = [];

  await Promise.all(
    selectedFeeds.map(async (feed) => {
      try {
        const res = await fetch(feed.rssUrl, {
          signal: AbortSignal.timeout(4000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SamryAIProMax/1.0)' },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 8) {
          const itemXml = match[1];
          const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
          const rawLink = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
          const rawPubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
          const rawDesc = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';

          const title = decodeHtmlEntities(rawTitle);
          const link = decodeHtmlEntities(rawLink);
          const snippet = decodeHtmlEntities(rawDesc) || title;
          if (!title || !link.startsWith('http')) continue;

          const freshness = getFreshnessInfo(rawPubDate);
          collected.push({
            title,
            url: link,
            siteName: feed.name,
            snippet,
            publishedAt: rawPubDate ? rawPubDate.trim() : undefined,
            publishedTimestamp: freshness.timestamp,
            freshnessLabel: freshness.label,
            sourceType: 'news',
          });
          count++;
        }

        if (count > 0) {
          feedsHit.push(feed.name);
        }
      } catch {
        // Ignore single RSS failure
      }
    })
  );

  // Rank items matching query keywords higher while preserving recency
  collected.sort((a, b) => {
    const aText = `${a.title} ${a.snippet}`.toLowerCase();
    const bText = `${b.title} ${b.snippet}`.toLowerCase();
    const aScore = keywords.reduce((acc, kw) => (aText.includes(kw) ? acc + 1 : acc), 0);
    const bScore = keywords.reduce((acc, kw) => (bText.includes(kw) ? acc + 1 : acc), 0);
    if (bScore !== aScore) return bScore - aScore;
    return (b.publishedTimestamp || 0) - (a.publishedTimestamp || 0);
  });

  return { items: collected.slice(0, 6), feedsHit };
}

export async function performRealTimeWebSearch(
  rawQuery: string,
  options?: { mode?: string }
): Promise<RealTimeWebSearchOutput> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const tomorrow = new Date(now.getTime() + 86400000);

  const searchQuery = buildSearchQuery(rawQuery);
  const categories = detectOfficialCategories(rawQuery, options?.mode);
  const chadPlateDossier = lookupChadPlateInfo(rawQuery);

  const sportsRelated = isSportsQuery(rawQuery) || categories.includes('football');
  const isPurePlateQuery = Boolean(chadPlateDossier) && /\b(?:plaque|plaques|immatriculation)\b/i.test(rawQuery) && !/\b(?:actualité|actualités|nouvelles|aujourd'hui|hier|récent|info|infos)\b/i.test(rawQuery);
  const needsOfficialNews =
    !isPurePlateQuery &&
    (categories.includes('africa_world_news') || categories.includes('chad_info') || options?.mode === 'news');
  const scienceOrEncyclopedic =
    options?.mode === 'study' ||
    options?.mode === 'medicine' ||
    categories.includes('chad_info') ||
    categories.includes('science_education') ||
    categories.includes('health_biology') ||
    /\b(?:science|scientifique|physique|biologie|médecine|espace|nasa|maladie|théorie|histoire)\b/i.test(
      rawQuery
    );

  // Build targeted DuckDuckGo query scoped strictly to the category's official allowlisted domains
  let targetedDdgQuery = searchQuery;
  if (categories.includes('canada_immigration') && !categories.includes('canada_scholarships')) {
    targetedDdgQuery = `${searchQuery} (site:canada.ca OR site:ircc.canada.ca)`;
  } else if (categories.includes('canada_scholarships')) {
    targetedDdgQuery = `${searchQuery} (site:bcdi2030.ca OR site:mccallmacbainscholars.org OR site:mastercardfdn.org OR site:mcgill.ca OR site:ulaval.ca OR site:umontreal.ca OR site:uottawa.ca OR site:concordia.ca OR site:utoronto.ca OR site:ubc.ca OR site:scholarships.gc.ca)`;
  } else if (categories.includes('health_biology')) {
    targetedDdgQuery = `${searchQuery} (site:who.int OR site:pasteur.fr OR site:sante.gouv.fr OR site:nih.gov OR site:cdc.gov OR site:thelancet.com)`;
  } else if (categories.includes('un_jobs_humanitarian')) {
    targetedDdgQuery = `${searchQuery} (site:unv.org OR site:jobs.un.org OR site:reliefweb.int OR site:unjobs.org OR site:undp.org)`;
  } else if (categories.includes('science_education')) {
    targetedDdgQuery = `${searchQuery} (site:unesco.org OR site:khanacademy.org OR site:coursera.org OR site:edx.org OR site:sciencedirect.com OR site:nature.com OR site:wikipedia.org)`;
  } else if (categories.includes('football')) {
    targetedDdgQuery = `${searchQuery} (site:uefa.com OR site:fifa.com OR site:espn.com OR site:onefootball.com OR site:livescore.com OR site:flashscore.fr OR site:sofascore.com OR site:transfermarkt.com OR site:footmercato.net)`;
  } else if (categories.includes('chad_info')) {
    targetedDdgQuery = `${searchQuery} (site:tchadinfos.com OR site:alwihdainfo.com OR site:presidence.td OR site:primature.td OR site:sante.gouv.td OR site:univ-ndjamena.com OR site:wikipedia.org)`;
  } else if (categories.includes('africa_world_news')) {
    targetedDdgQuery = `${searchQuery} (site:rfi.fr OR site:france24.com OR site:bbc.com OR site:jeuneafrique.com OR site:lemonde.fr OR site:aljazeera.com OR site:apnews.com OR site:reuters.com OR site:africanews.com)`;
  }

  const [ddgResults, gNewsResults, bingNewsResults, espnData, wikiResults, officialNewsData] =
    await Promise.all([
      isPurePlateQuery ? Promise.resolve([]) : searchDuckDuckGo(targetedDdgQuery),
      isPurePlateQuery ? Promise.resolve([]) : searchGoogleNewsRss(searchQuery),
      isPurePlateQuery ? Promise.resolve([]) : searchBingNewsRss(searchQuery),
      sportsRelated ? fetchEspnLiveScores(rawQuery) : Promise.resolve({ matches: [], sources: [] }),
      !isPurePlateQuery && scienceOrEncyclopedic ? searchWikipediaFr(searchQuery) : Promise.resolve([]),
      needsOfficialNews
        ? fetchOfficialRssFeeds(rawQuery, categories.includes('chad_info'))
        : Promise.resolve({ items: [], feedsHit: [] }),
    ]);

  const enginesUsed: string[] = [];
  if (ddgResults.length > 0) enginesUsed.push('DuckDuckGo (Base Officielle)');
  if (officialNewsData.feedsHit.length > 0) {
    enginesUsed.push(...officialNewsData.feedsHit);
  }
  if (gNewsResults.length > 0) enginesUsed.push('Google Actualités (Sites Autorisés)');
  if (bingNewsResults.length > 0) enginesUsed.push('Bing Actualités (Sites Autorisés)');
  if (espnData.matches.length > 0) enginesUsed.push('ESPN Live Scores');
  if (wikiResults.length > 0) enginesUsed.push('Wikipédia FR');
  if (chadPlateDossier) enginesUsed.push('Référentiel Officiel Tchad');

  const officialRefsToInclude: WebSearchResultItem[] = [];
  const officialGuidance: string[] = [];
  const urlsToFetchExcerpts: Array<{ title: string; url: string; siteName: string }> = [];

  if (categories.includes('canada_immigration')) {
    officialGuidance.push(
      '1. CANADA IMMIGRATION / VISA : Utilise uniquement canada.ca, ircc.canada.ca et les pages officielles etudier-canada.html, travailler-canada.html, visiter-canada.html.'
    );
    for (const ref of OFFICIAL_CANADA_IMMIGRATION_SITES) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
      if (ref.fetchPage) urlsToFetchExcerpts.push(ref);
    }
  }

  if (categories.includes('canada_scholarships')) {
    officialGuidance.push(
      "2. BOURSES CANADA 100% VRAIES : bcdi2030.ca (Tchad éligible), mccallmacbainscholars.org (McGill Master 100%), mastercardfdn.org, mcgill.ca, utoronto.ca, ubc.ca, ulaval.ca, umontreal.ca, uottawa.ca, concordia.ca, scholarships.gc.ca."
    );
    for (const ref of OFFICIAL_CANADA_SCHOLARSHIP_SITES) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
      if (ref.fetchPage && urlsToFetchExcerpts.length < 3) {
        urlsToFetchExcerpts.push(ref);
      }
    }
  }

  if (categories.includes('football')) {
    officialGuidance.push(
      '3. FOOTBALL OFFICIEL : uefa.com, fifa.com, espn.com, onefootball.com, livescore.com, flashscore.fr, sofascore.com, transfermarkt.com, footmercato.net.'
    );
    for (const ref of OFFICIAL_FOOTBALL_SITES.slice(0, 4)) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (categories.includes('chad_info')) {
    officialGuidance.push(
      '4. TCHAD OFFICIEL : presidence.td, primature.td, sante.gouv.td, univ-ndjamena.com, tchadinfos.com, alwihdainfo.com, wikipedia.org.'
    );
    for (const ref of OFFICIAL_CHAD_SITES.slice(0, 5)) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (categories.includes('health_biology')) {
    officialGuidance.push(
      '6. SANTÉ & BIOLOGIE OFFICIELLES : who.int, pasteur.fr, sante.gouv.fr, nih.gov, cdc.gov, thelancet.com.'
    );
    for (const ref of OFFICIAL_HEALTH_BIOLOGY_SITES) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (categories.includes('science_education')) {
    officialGuidance.push(
      '7. SCIENCE & ÉTUDES OFFICIELLES : unesco.org, khanacademy.org, coursera.org, edx.org, sciencedirect.com, nature.com.'
    );
    for (const ref of OFFICIAL_SCIENCE_EDUCATION_SITES) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (categories.includes('un_jobs_humanitarian')) {
    officialGuidance.push(
      '8. EMPLOI, ONU & HUMANITAIRE OFFICIELS : unv.org, jobs.un.org, reliefweb.int, unjobs.org, undp.org.'
    );
    for (const ref of OFFICIAL_UN_JOBS_SITES) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (categories.includes('official_social')) {
    officialGuidance.push(
      '9. RÉSEAUX SOCIAUX OFFICIELS (COCHE BLEUE UNIQUEMENT) :\n• Facebook : facebook.com/UEFA, facebook.com/FIFA, facebook.com/Canada, facebook.com/UniversiteMcGill, facebook.com/PresidenceTchad\n• Instagram : instagram.com/uefa_official, instagram.com/fifa, instagram.com/portugal, instagram.com/cristiano (ATTENTION : il a pris sa retraite en 2026), instagram.com/canada, instagram.com/mcgillu\n• X/Twitter : x.com/UEFA, x.com/FIFAcom, x.com/Canada, x.com/McGillU\n• YouTube : youtube.com/@UEFA, youtube.com/@FIFA, youtube.com/@Canada, youtube.com/@RFI, youtube.com/@France24\n• Threads : threads.net/@uefa_official, threads.net/@fifa\n• TikTok : tiktok.com/@uefa, tiktok.com/@fifa\nRÈGLE : Ne fais confiance à AUCUN autre compte sur les réseaux sociaux sans coche bleue figurant dans cette liste.'
    );
    for (const ref of OFFICIAL_SOCIAL_VERIFIED_SITES.slice(0, 4)) {
      officialRefsToInclude.push({
        title: ref.title,
        url: ref.url,
        siteName: ref.siteName,
        snippet: ref.description,
        sourceType: 'official',
      });
    }
  }

  if (
    categories.includes('anti_scam') ||
    categories.includes('canada_scholarships') ||
    categories.includes('canada_immigration')
  ) {
    officialGuidance.push(
      '10. SITES À NE JAMAIS CROIRE — ARNAQUES :\n• Tout site qui demande de l\'argent pour une bourse = ARNAQUE\n• Tout site qui dit "Gagnez 1 million" = ARNAQUE\n• Tout compte Facebook sans coche bleue qui dit "Bourse Canada" = ARNAQUE\n• Tout WhatsApp qui demande de payer pour un visa = ARNAQUE'
    );
  }

  const seenUrls = new Set<string>();
  const combined: WebSearchResultItem[] = [];

  const pushUnique = (items: WebSearchResultItem[]) => {
    for (const item of items) {
      if (!item.url || seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      combined.push(item);
    }
  };

  pushUnique(espnData.sources);
  pushUnique(officialRefsToInclude);
  pushUnique(officialNewsData.items);
  pushUnique(gNewsResults);
  pushUnique(ddgResults);
  pushUnique(bingNewsResults);
  pushUnique(wikiResults);

  for (const item of ddgResults.slice(0, 2)) {
    if (urlsToFetchExcerpts.length < 3 && !urlsToFetchExcerpts.some((u) => u.url === item.url)) {
      urlsToFetchExcerpts.push({ title: item.title, url: item.url, siteName: item.siteName });
    }
  }

  const pageExcerpts: Array<{ title: string; url: string; siteName: string; excerpt: string }> = [];
  if (urlsToFetchExcerpts.length > 0) {
    const fetched = await Promise.all(
      urlsToFetchExcerpts.slice(0, 3).map(async (item) => {
        const excerpt = await fetchPageExcerpt(item.url);
        return excerpt ? { title: item.title, url: item.url, siteName: item.siteName, excerpt } : null;
      })
    );
    for (const f of fetched) {
      if (f) pageExcerpts.push(f);
    }
  }

  return {
    query: searchQuery,
    executedAt: now.toISOString(),
    todayLabel: formatFrenchDate(now),
    yesterdayLabel: formatFrenchDate(yesterday),
    tomorrowLabel: formatFrenchDate(tomorrow),
    categories,
    chadPlateDossier,
    officialGuidance,
    results: combined.slice(0, 10),
    pageExcerpts,
    sportsMatches: espnData.matches.slice(0, 20),
    enginesUsed: Array.from(new Set(enginesUsed)),
  };
}

export function formatSearchContextForPrompt(searchOutput: RealTimeWebSearchOutput): string {
  const now = new Date();
  const parisNow = now.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

  if (
    searchOutput.results.length === 0 &&
    searchOutput.sportsMatches.length === 0 &&
    searchOutput.pageExcerpts.length === 0 &&
    !searchOutput.chadPlateDossier &&
    (!searchOutput.officialGuidance || searchOutput.officialGuidance.length === 0)
  ) {
    return `[RECHERCHE WEB SUR LA BASE OFFICIELLE EFFECTUÉE LE ${parisNow} (Paris/CET)]
Repères temporels : Aujourd'hui = ${searchOutput.todayLabel} | Hier = ${searchOutput.yesterdayLabel} | Demain = ${searchOutput.tomorrowLabel}
Requête : "${searchOutput.query}"
Aucun résultat n'a été trouvé sur les sites officiels autorisés de la base de SAMRY IA.
RÈGLE STRICTE : Réponds honnêtement « Je ne sais pas » (en précisant qu'aucun des sites officiels autorisés de ta base ne fournit cette information). N'utilise AUCUN site hors de la liste officielle et n'invente jamais de réponse.`;
  }

  const sections: string[] = [
    `[DONNÉES RÉELLES ET BASE OFFICIELLE VÉRIFIÉE — ${parisNow} (Paris/CET)]`,
    `Repères calendaires exacts :
- Hier : ${searchOutput.yesterdayLabel}
- Aujourd'hui : ${searchOutput.todayLabel}
- Demain : ${searchOutput.tomorrowLabel}`,
    `Requête effectuée : "${searchOutput.query}"`,
    `Sources & moteurs interrogés (Base officielle uniquement) : ${searchOutput.enginesUsed.join(', ') || 'Base Officielle SAMRY IA'}`,
  ];

  if (searchOutput.officialGuidance && searchOutput.officialGuidance.length > 0) {
    sections.push(`--- RÈGLES OFFICIELLES APPLICABLES ---\n${searchOutput.officialGuidance.join('\n\n')}`);
  }

  if (searchOutput.chadPlateDossier) {
    sections.push(searchOutput.chadPlateDossier);
  }

  if (searchOutput.sportsMatches.length > 0) {
    sections.push(
      `--- MATCHS, HORAIRES ET SCORES SPORTIFS EN DIRECT (ESPN) ---\n${searchOutput.sportsMatches
        .map((m) => `• ${m}`)
        .join('\n')}`
    );
  }

  if (searchOutput.results.length > 0) {
    sections.push(
      `--- SITES OFFICIELS AUTORISÉS, ACTUALITÉS & RÉSULTATS ---\n${searchOutput.results
        .map(
          (r, idx) =>
            `[${idx + 1}] ${r.title}\nSource : ${r.siteName}${
              r.freshnessLabel ? ` | Fraîcheur : ${r.freshnessLabel}` : ''
            }${r.publishedAt ? ` (${r.publishedAt})` : ''}\nURL : ${r.url}\nRésumé : ${r.snippet}`
        )
        .join('\n\n')}`
    );
  }

  if (searchOutput.pageExcerpts.length > 0) {
    sections.push(
      `--- CONTENU EXTRAIT DES PAGES OFFICIELLES VÉRIFIÉES ---\n${searchOutput.pageExcerpts
        .map((p) => `Page : ${p.title} (${p.siteName} - ${p.url})\nContenu extrait : ${p.excerpt}`)
        .join('\n\n---\n')}`
    );
  }

  sections.push(
    `[CONSIGNES STRICTES DE LA BASE OFFICIELLE]
1. RÈGLE D'EXCLUSIVITÉ : N'utilise QUE les sites officiels autorisés de ta base. Si une information précise ne figure pas dans les sites autorisés ou dans les résultats vérifiés ci-dessus, dis clairement « Je ne sais pas » au lieu d'inventer ou d'utiliser un site non autorisé.
2. RÈGLE ANTI-ARNAQUE :
   - Argent demandé pour une bourse = ARNAQUE.
   - Site qui promet « Gagnez 1 million » = ARNAQUE.
   - Compte Facebook sans coche bleue disant « Bourse Canada » = ARNAQUE.
   - WhatsApp demandant de payer pour un visa = ARNAQUE.
3. RÉSEAUX SOCIAUX : Ne reconnais comme fiables que les comptes officiels vérifiés (coche bleue) de la catégorie 9. Note importante : @cristiano sur Instagram concerne Cristiano Ronaldo (retraité en 2026).
4. DATES & LIENS : Vérifie la date exacte (hier, aujourd'hui, demain) et inclus les liens Markdown des sites officiels cités.${
      searchOutput.chadPlateDossier
        ? `\n5. PLAQUES DU TCHAD (OBLIGATOIRE) : Recopie EXACTEMENT sans modifier un seul nom ni numéro :\n${searchOutput.chadPlateDossier}`
        : ''
    }`
  );

  return sections.join('\n\n');
}
