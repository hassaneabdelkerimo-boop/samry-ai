export type OfficialCategory =
  | 'canada_immigration'
  | 'canada_scholarships'
  | 'football'
  | 'chad_info'
  | 'africa_world_news'
  | 'health_biology'
  | 'science_education'
  | 'un_jobs_humanitarian'
  | 'official_social'
  | 'anti_scam';

export interface ChadPlateEntry {
  code: string;
  province: string;
  capital?: string;
  label: string;
}

export const CHAD_PLATES: ChadPlateEntry[] = [
  { code: '01', province: 'Batha', capital: 'Ati', label: '01 = Batha - Ati' },
  { code: '02', province: 'Borkou', capital: 'Faya', label: '02 = Borkou - Faya' },
  { code: '03', province: 'Chari-Baguirmi', capital: 'Massenya', label: '03 = Chari-Baguirmi - Massenya' },
  { code: '04', province: 'Guéra', capital: 'Mongo', label: '04 = Guéra - Mongo' },
  { code: '05', province: 'Hadjer-Lamis', capital: 'Massakory', label: '05 = Hadjer-Lamis - Massakory' },
  { code: '06', province: 'Kanem', capital: 'Mao', label: '06 = Kanem - Mao' },
  { code: '07', province: 'Lac', capital: 'Bol', label: '07 = Lac - Bol' },
  { code: '08', province: 'Logone Occidental', capital: 'Moundou', label: '08 = Logone Occidental - Moundou' },
  { code: '09', province: 'Logone Oriental', capital: 'Doba', label: '09 = Logone Oriental - Doba' },
  { code: '10', province: 'Mandoul', capital: 'Koumra', label: '10 = Mandoul - Koumra' },
  { code: '11', province: 'Mayo-Kebbi Est', capital: 'Bongor', label: '11 = Mayo-Kebbi Est - Bongor' },
  { code: '12', province: 'Mayo-Kebbi Ouest', capital: 'Pala', label: '12 = Mayo-Kebbi Ouest - Pala' },
  { code: '13', province: 'Moyen-Chari', capital: 'Sarh', label: '13 = Moyen-Chari - Sarh' },
  { code: '14', province: 'Ouaddaï', capital: 'Abéché', label: '14 = Ouaddaï - Abéché' },
  { code: '15', province: 'Salamat', capital: 'Am Timan', label: '15 = Salamat - Am Timan' },
  { code: '16', province: 'Tandjilé', capital: 'Laï', label: '16 = Tandjilé - Laï' },
  { code: '17', province: 'Wadi Fira', capital: 'Biltine', label: '17 = Wadi Fira - Biltine' },
  { code: '18', province: "N'Djamena", label: "18 = N'Djamena" },
  { code: '19', province: 'Bahr El Gazel', capital: 'Moussoro', label: '19 = Bahr El Gazel - Moussoro' },
  { code: '20', province: 'Ennedi', capital: 'Fada', label: '20 = Ennedi - Fada' },
  { code: '21', province: 'Sila', capital: 'Goz Beïda', label: '21 = Sila - Goz Beïda' },
  { code: '22', province: 'Tibesti', capital: 'Bardaï', label: '22 = Tibesti - Bardaï' },
];

export interface OfficialSiteRef {
  title: string;
  url: string;
  siteName: string;
  description: string;
  fetchPage?: boolean;
}

/**
 * Liste blanche stricte des domaines Web autorisés (Catégories 1 à 8).
 * Tout domaine non listé ici (hors comptes sociaux officiels vérifiés en Catégorie 9) est rejeté.
 */
export const ALLOWED_OFFICIAL_DOMAINS: string[] = [
  // 1. Gouvernement Canada
  'canada.ca',
  'ircc.canada.ca',
  // 2. Bourses Canada 100% vraies
  'bcdi2030.ca',
  'mccallmacbainscholars.org',
  'mastercardfdn.org',
  'mcgill.ca',
  'utoronto.ca',
  'ubc.ca',
  'ulaval.ca',
  'umontreal.ca',
  'uottawa.ca',
  'concordia.ca',
  'scholarships.gc.ca',
  // 3. Football - Scores vrais
  'uefa.com',
  'fifa.com',
  'espn.com',
  'onefootball.com',
  'livescore.com',
  'flashscore.fr',
  'sofascore.com',
  'transfermarkt.com',
  'footmercato.net',
  // 4. Tchad - Infos vraies
  'presidence.td',
  'primature.td',
  'sante.gouv.td',
  'univ-ndjamena.com',
  'tchadinfos.com',
  'alwihdainfo.com',
  'wikipedia.org',
  // 5. Nouvelles Monde et Afrique - Vraies
  'rfi.fr',
  'france24.com',
  'bbc.com',
  'bbci.co.uk',
  'jeuneafrique.com',
  'lemonde.fr',
  'aljazeera.com',
  'apnews.com',
  'reuters.com',
  'africanews.com',
  // 6. Santé - Biologie - Vrai
  'who.int',
  'pasteur.fr',
  'sante.gouv.fr',
  'nih.gov',
  'cdc.gov',
  'thelancet.com',
  // 7. Science et Études
  'unesco.org',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'sciencedirect.com',
  'nature.com',
  // 8. Emploi - ONU - Humanitaire
  'unv.org',
  'jobs.un.org',
  'reliefweb.int',
  'unjobs.org',
  'undp.org',
];

/**
 * Catégorie 9 : Réseaux sociaux — SEULEMENT les comptes officiels vérifiés (coche bleue).
 */
export const ALLOWED_SOCIAL_HANDLES: Record<string, string[]> = {
  facebook: ['/uefa', '/fifa', '/canada', '/universitemcgill', '/presidencetchad'],
  instagram: ['/uefa_official', '/fifa', '/portugal', '/cristiano', '/canada', '/mcgillu'],
  x: ['/uefa', '/fifacom', '/canada', '/mcgillu'],
  youtube: ['/@uefa', '/@fifa', '/@canada', '/@rfi', '/@france24'],
  threads: ['/@uefa_official', '/@fifa'],
  tiktok: ['/@uefa', '/@fifa'],
};

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function getSocialPlatformFromHost(host: string): keyof typeof ALLOWED_SOCIAL_HANDLES | null {
  if (matchesDomain(host, 'facebook.com') || matchesDomain(host, 'fb.com')) return 'facebook';
  if (matchesDomain(host, 'instagram.com')) return 'instagram';
  if (matchesDomain(host, 'x.com') || matchesDomain(host, 'twitter.com')) return 'x';
  if (matchesDomain(host, 'youtube.com') || matchesDomain(host, 'youtu.be')) return 'youtube';
  if (matchesDomain(host, 'threads.net') || matchesDomain(host, 'threads.com')) return 'threads';
  if (matchesDomain(host, 'tiktok.com')) return 'tiktok';
  return null;
}

/**
 * Vérifie strictement si une URL appartient à la base officielle autorisée (domaines ou comptes sociaux vérifiés).
 */
export function isAllowedOfficialUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase().replace(/^(?:www|m|mobile|fr|en)\./, '');
    const fullHost = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase().replace(/\/+$/, '') || '/';

    // 1. Check social media platforms: ONLY exact verified official handles are allowed
    const socialPlatform = getSocialPlatformFromHost(fullHost);
    if (socialPlatform) {
      const allowedPaths = ALLOWED_SOCIAL_HANDLES[socialPlatform] || [];
      return allowedPaths.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
      );
    }

    // 2. For BBC RSS feeds, restrict to Afrique feed
    if (matchesDomain(fullHost, 'bbci.co.uk')) {
      return path.includes('/afrique');
    }

    // 3. Check official domains allowlist
    return ALLOWED_OFFICIAL_DOMAINS.some(
      (domain) => matchesDomain(fullHost, domain) || matchesDomain(host, domain)
    );
  } catch {
    return false;
  }
}

export const OFFICIAL_CANADA_IMMIGRATION_SITES: OfficialSiteRef[] = [
  {
    title: 'Gouvernement du Canada — Portail officiel (canada.ca)',
    url: 'https://www.canada.ca/',
    siteName: 'canada.ca',
    description: 'Site officiel du gouvernement du Canada.',
  },
  {
    title: 'Portail officiel IRCC Canada (ircc.canada.ca)',
    url: 'https://ircc.canada.ca/',
    siteName: 'ircc.canada.ca',
    description: 'Services officiels d’Immigration, Réfugiés et Citoyenneté Canada.',
  },
  {
    title: 'Étudier au Canada — Permis d’études et frais officiels (IRCC)',
    url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
    siteName: 'canada.ca',
    description: 'Conditions officielles, permis d’études et frais sur Canada.ca.',
    fetchPage: true,
  },
  {
    title: 'Travailler au Canada — Permis de travail officiel (IRCC)',
    url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada.html',
    siteName: 'canada.ca',
    description: 'Informations officielles sur les permis de travail au Canada.',
    fetchPage: true,
  },
  {
    title: 'Visiter le Canada — Visa de visiteur officiel (IRCC)',
    url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html',
    siteName: 'canada.ca',
    description: 'Démarches officielles pour obtenir un visa de visiteur ou AVE.',
    fetchPage: true,
  },
];

export const OFFICIAL_CANADA_SCHOLARSHIP_SITES: OfficialSiteRef[] = [
  {
    title: 'Bourse BCDI 2030 (Tchad éligible — Programme officiel)',
    url: 'https://bcdi2030.ca/',
    siteName: 'bcdi2030.ca',
    description: 'Bourses canadiennes pour le développement international (Tchad éligible).',
    fetchPage: true,
  },
  {
    title: 'Bourses McCall MacBain — Université McGill (Master 100%)',
    url: 'https://www.mccallmacbainscholars.org/',
    siteName: 'mccallmacbainscholars.org',
    description: 'Bourse complète (100%) pour étudier en maîtrise à McGill.',
    fetchPage: true,
  },
  {
    title: 'Mastercard Foundation Scholars Program',
    url: 'https://mastercardfdn.org/',
    siteName: 'mastercardfdn.org',
    description: 'Bourses officielles 100% pour étudiants africains.',
    fetchPage: true,
  },
  {
    title: 'Bourses du gouvernement du Canada (scholarships.gc.ca)',
    url: 'https://www.scholarships.gc.ca/',
    siteName: 'scholarships.gc.ca',
    description: 'Portail officiel des bourses internationales du gouvernement du Canada (scholarships.gc.ca).',
  },
  {
    title: 'Université McGill (mcgill.ca)',
    url: 'https://www.mcgill.ca/mastercardfdn-scholars',
    siteName: 'mcgill.ca',
    description: 'Bourses et programmes officiels à l’Université McGill.',
  },
  {
    title: 'Université Laval (ulaval.ca)',
    url: 'https://www.ulaval.ca/',
    siteName: 'ulaval.ca',
    description: 'Université francophone de Québec (bourses et admissions).',
  },
  {
    title: 'Université de Montréal (umontreal.ca)',
    url: 'https://www.umontreal.ca/',
    siteName: 'umontreal.ca',
    description: 'Site officiel de l’Université de Montréal.',
  },
  {
    title: 'Université d’Ottawa (uottawa.ca)',
    url: 'https://www.uottawa.ca/',
    siteName: 'uottawa.ca',
    description: 'Site officiel de l’Université d’Ottawa.',
  },
  {
    title: 'Université Concordia (concordia.ca)',
    url: 'https://www.concordia.ca/',
    siteName: 'concordia.ca',
    description: 'Site officiel de l’Université Concordia à Montréal.',
  },
  {
    title: 'Université de Toronto (utoronto.ca)',
    url: 'https://www.utoronto.ca/',
    siteName: 'utoronto.ca',
    description: 'Site officiel de l’Université de Toronto.',
  },
  {
    title: 'Université de la Colombie-Britannique (ubc.ca)',
    url: 'https://www.ubc.ca/',
    siteName: 'ubc.ca',
    description: 'Site officiel de l’Université UBC.',
  },
];

export const OFFICIAL_FOOTBALL_SITES: OfficialSiteRef[] = [
  {
    title: 'UEFA.com — Site officiel',
    url: 'https://fr.uefa.com/',
    siteName: 'uefa.com',
    description: 'Compétitions officielles UEFA, résultats et classements.',
  },
  {
    title: 'FIFA.com — Site officiel',
    url: 'https://www.fifa.com/fr',
    siteName: 'fifa.com',
    description: 'Actualités, classements et compétitions FIFA.',
  },
  {
    title: 'ESPN Football — Scores et calendriers en direct',
    url: 'https://www.espn.com/soccer/scoreboard',
    siteName: 'espn.com',
    description: 'Scores en direct, horaires et résultats officiels.',
  },
  {
    title: 'OneFootball',
    url: 'https://onefootball.com/fr/accueil',
    siteName: 'onefootball.com',
    description: 'Matchs et actualités football.',
  },
  {
    title: 'LiveScore',
    url: 'https://www.livescore.com/',
    siteName: 'livescore.com',
    description: 'Scores en direct.',
  },
  {
    title: 'Flashscore.fr',
    url: 'https://www.flashscore.fr/',
    siteName: 'flashscore.fr',
    description: 'Résultats et scores en direct.',
  },
  {
    title: 'Sofascore',
    url: 'https://www.sofascore.com/fr/',
    siteName: 'sofascore.com',
    description: 'Statistiques, notes et scores football en direct.',
  },
  {
    title: 'Transfermarkt',
    url: 'https://www.transfermarkt.com/',
    siteName: 'transfermarkt.com',
    description: 'Transferts, valeurs marchandes et effectifs officiels.',
  },
  {
    title: 'Foot Mercato',
    url: 'https://www.footmercato.net/',
    siteName: 'footmercato.net',
    description: 'Actualités transferts et résultats football.',
  },
];

export const OFFICIAL_CHAD_SITES: OfficialSiteRef[] = [
  {
    title: 'Présidence de la République du Tchad',
    url: 'https://presidence.td/',
    siteName: 'presidence.td',
    description: 'Site officiel de la Présidence de la République du Tchad.',
  },
  {
    title: 'Primature de la République du Tchad',
    url: 'https://primature.td/',
    siteName: 'primature.td',
    description: 'Site officiel de la Primature du Tchad.',
  },
  {
    title: 'Ministère de la Santé Publique du Tchad (sante.gouv.td)',
    url: 'https://sante.gouv.td/',
    siteName: 'sante.gouv.td',
    description: 'Portail officiel de la santé publique au Tchad.',
  },
  {
    title: 'Université de N’Djamena (univ-ndjamena.com)',
    url: 'https://univ-ndjamena.com/',
    siteName: 'univ-ndjamena.com',
    description: 'Site officiel de l’Université de N’Djamena.',
  },
  {
    title: 'Tchadinfos',
    url: 'https://tchadinfos.com/',
    siteName: 'tchadinfos.com',
    description: 'Média d’information sur l’actualité au Tchad.',
  },
  {
    title: 'Alwihda Info',
    url: 'https://www.alwihdainfo.com/',
    siteName: 'alwihdainfo.com',
    description: 'Actualités et informations du Tchad.',
  },
  {
    title: 'Wikipédia — Plaques d’immatriculation du Tchad',
    url: "https://fr.wikipedia.org/wiki/Plaque_d%27immatriculation_tchadienne",
    siteName: 'wikipedia.org',
    description: 'Référentiel des plaques d’immatriculation du Tchad.',
  },
  {
    title: 'Wikipédia — Provinces du Tchad',
    url: 'https://fr.wikipedia.org/wiki/Provinces_du_Tchad',
    siteName: 'wikipedia.org',
    description: 'Liste officielle des provinces et chefs-lieux du Tchad.',
  },
];

export const OFFICIAL_HEALTH_BIOLOGY_SITES: OfficialSiteRef[] = [
  {
    title: 'Organisation Mondiale de la Santé (OMS / WHO)',
    url: 'https://www.who.int/fr',
    siteName: 'who.int',
    description: 'Données sanitaires mondiales officielles de l’OMS.',
  },
  {
    title: 'Institut Pasteur (pasteur.fr)',
    url: 'https://www.pasteur.fr/fr',
    siteName: 'pasteur.fr',
    description: 'Recherches biomédicales, maladies infectieuses et biologie.',
  },
  {
    title: 'Ministère de la Santé — France (sante.gouv.fr)',
    url: 'https://sante.gouv.fr/',
    siteName: 'sante.gouv.fr',
    description: 'Recommandations et fiches santé publiques officielles.',
  },
  {
    title: 'National Institutes of Health (NIH)',
    url: 'https://www.nih.gov/',
    siteName: 'nih.gov',
    description: 'Recherche médicale et publications scientifiques NIH / PubMed.',
  },
  {
    title: 'Centers for Disease Control and Prevention (CDC)',
    url: 'https://www.cdc.gov/',
    siteName: 'cdc.gov',
    description: 'Données de santé publique et prévention des maladies.',
  },
  {
    title: 'The Lancet',
    url: 'https://www.thelancet.com/',
    siteName: 'thelancet.com',
    description: 'Revue médicale scientifique internationale à comité de lecture.',
  },
];

export const OFFICIAL_SCIENCE_EDUCATION_SITES: OfficialSiteRef[] = [
  {
    title: 'UNESCO (unesco.org)',
    url: 'https://www.unesco.org/fr',
    siteName: 'unesco.org',
    description: 'Éducation, sciences, culture et ressources mondiales de l’UNESCO.',
  },
  {
    title: 'Khan Academy',
    url: 'https://fr.khanacademy.org/',
    siteName: 'khanacademy.org',
    description: 'Cours gratuits en mathématiques, sciences et informatique.',
  },
  {
    title: 'Coursera',
    url: 'https://www.coursera.org/',
    siteName: 'coursera.org',
    description: 'Cours universitaires et certifications en ligne.',
  },
  {
    title: 'edX',
    url: 'https://www.edx.org/',
    siteName: 'edx.org',
    description: 'Programmes académiques des meilleures universités.',
  },
  {
    title: 'ScienceDirect',
    url: 'https://www.sciencedirect.com/',
    siteName: 'sciencedirect.com',
    description: 'Base d’articles scientifiques et revues académiques.',
  },
  {
    title: 'Nature',
    url: 'https://www.nature.com/',
    siteName: 'nature.com',
    description: 'Revue scientifique internationale de référence.',
  },
];

export const OFFICIAL_UN_JOBS_SITES: OfficialSiteRef[] = [
  {
    title: 'Volontaires des Nations Unies (UNV)',
    url: 'https://www.unv.org/fr',
    siteName: 'unv.org',
    description: 'Missions officielles de volontariat des Nations Unies.',
  },
  {
    title: 'UN Careers — Emplois à l’ONU (jobs.un.org)',
    url: 'https://jobs.un.org/',
    siteName: 'jobs.un.org',
    description: 'Portail officiel de recrutement des Nations Unies.',
  },
  {
    title: 'ReliefWeb (OCHA / ONU)',
    url: 'https://reliefweb.int/',
    siteName: 'reliefweb.int',
    description: 'Rapports humanitaires et offres d’emploi ONG / ONU.',
  },
  {
    title: 'UNjobs',
    url: 'https://unjobs.org/',
    siteName: 'unjobs.org',
    description: 'Agrégateur d’offres d’emploi ONU et organisations internationales.',
  },
  {
    title: 'PNUD / UNDP (undp.org)',
    url: 'https://www.undp.org/fr',
    siteName: 'undp.org',
    description: 'Programme des Nations Unies pour le développement.',
  },
];

export const OFFICIAL_SOCIAL_VERIFIED_SITES: OfficialSiteRef[] = [
  {
    title: 'Facebook Officiel UEFA (coche bleue)',
    url: 'https://www.facebook.com/UEFA',
    siteName: 'facebook.com',
    description: 'Compte officiel vérifié UEFA sur Facebook.',
  },
  {
    title: 'Facebook Officiel FIFA (coche bleue)',
    url: 'https://www.facebook.com/FIFA',
    siteName: 'facebook.com',
    description: 'Compte officiel vérifié FIFA sur Facebook.',
  },
  {
    title: 'Facebook Officiel Canada (coche bleue)',
    url: 'https://www.facebook.com/Canada',
    siteName: 'facebook.com',
    description: 'Compte officiel vérifié Canada sur Facebook.',
  },
  {
    title: 'Facebook Officiel Université McGill (coche bleue)',
    url: 'https://www.facebook.com/UniversiteMcGill',
    siteName: 'facebook.com',
    description: 'Compte officiel vérifié Université McGill sur Facebook.',
  },
  {
    title: 'Facebook Officiel Présidence du Tchad (coche bleue)',
    url: 'https://www.facebook.com/PresidenceTchad',
    siteName: 'facebook.com',
    description: 'Compte officiel vérifié Présidence du Tchad sur Facebook.',
  },
  {
    title: 'Instagram Officiel Cristiano Ronaldo (retraité en 2026)',
    url: 'https://www.instagram.com/cristiano',
    siteName: 'instagram.com',
    description: 'Compte officiel vérifié @cristiano (retraité en 2026).',
  },
  {
    title: 'Instagram Officiel UEFA / FIFA / Portugal / Canada / McGill',
    url: 'https://www.instagram.com/uefa_official',
    siteName: 'instagram.com',
    description: 'Comptes Instagram vérifiés : @uefa_official, @fifa, @portugal, @cristiano, @canada, @mcgillu.',
  },
  {
    title: 'YouTube Officiel France 24 / RFI / UEFA / FIFA / Canada',
    url: 'https://www.youtube.com/@France24',
    siteName: 'youtube.com',
    description: 'Chaînes officielles YouTube : @UEFA, @FIFA, @Canada, @RFI, @France24.',
  },
];

export const OFFICIAL_AFRICA_WORLD_NEWS_FEEDS: Array<{ name: string; rssUrl: string; siteUrl: string }> = [
  {
    name: 'RFI Afrique',
    rssUrl: 'https://www.rfi.fr/fr/afrique/rss',
    siteUrl: 'https://www.rfi.fr/fr/afrique/',
  },
  {
    name: 'France 24',
    rssUrl: 'https://www.france24.com/fr/rss',
    siteUrl: 'https://www.france24.com/fr/',
  },
  {
    name: 'BBC Afrique',
    rssUrl: 'https://feeds.bbci.co.uk/afrique/rss.xml',
    siteUrl: 'https://www.bbc.com/afrique',
  },
  {
    name: 'Tchadinfos',
    rssUrl: 'https://tchadinfos.com/feed/',
    siteUrl: 'https://tchadinfos.com/',
  },
  {
    name: 'Le Monde',
    rssUrl: 'https://www.lemonde.fr/rss/une.xml',
    siteUrl: 'https://www.lemonde.fr/',
  },
  {
    name: 'Al Jazeera',
    rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    siteUrl: 'https://www.aljazeera.com/',
  },
  {
    name: 'Africanews',
    rssUrl: 'https://fr.africanews.com/feed/rss',
    siteUrl: 'https://fr.africanews.com/',
  },
];

export function detectOfficialCategories(query: string, mode?: string): OfficialCategory[] {
  const q = (query || '').toLowerCase();
  const categories: OfficialCategory[] = [];

  if (
    /\b(?:canada|ircc|visa|immigration|permis d'études|permis d etudes|permis de travail|résidence permanente|travailler au canada|visiter le canada|étudier au canada|etudier au canada)\b/i.test(
      q
    )
  ) {
    categories.push('canada_immigration');
  }

  if (
    /\b(?:bourse|bourses|bcdi|mccall|macbain|mastercard|mcgill|utoronto|ubc|ulaval|laval|umontreal|montréal|uottawa|ottawa|concordia|scholarships\.gc\.ca|100%|gratuitement)\b/i.test(
      q
    )
  ) {
    categories.push('canada_scholarships');
  }

  if (
    /\b(?:foot|football|match|matchs|score|scores|uefa|fifa|espn|onefootball|livescore|flashscore|sofascore|transfermarkt|footmercato|ligue des champions|nations league|ligue 1|premier league|liga|serie a|bundesliga|can|coupe du monde|psg|real madrid|barcelone|barça|arsenal|liverpool|manchester|cristiano|ronaldo|portugal)\b/i.test(
      q
    )
  ) {
    categories.push('football');
  }

  if (
    /\b(?:tchad|tchadien|tchadienne|n'djamena|ndjamena|plaque|plaques|immatriculation|province|provinces|présidence|primature|tchadinfos|alwihda|alwihdainfo|sante\.gouv\.td|univ-ndjamena|wadi fira|biltine|ouaddaï|abéché|abeche|tandjilé|laï|batha|ati|borkou|faya|chari-baguirmi|massenya|guéra|mongo|hadjer-lamis|massakory|kanem|mao|lac|bol|logone|moundou|doba|mandoul|koumra|mayo-kebbi|bongor|pala|moyen-chari|sarh|salamat|am timan|bahr el gazel|moussoro|ennedi|fada|sila|goz beïda|goz beida|tibesti|bardaï|bardai)\b/i.test(
      q
    )
  ) {
    categories.push('chad_info');
  }

  if (
    mode === 'news' ||
    /\b(?:actualité|actualités|nouvelles|afrique|monde|international|rfi|france 24|france24|bbc|jeune afrique|tchadinfos|alwihda|lemonde|le monde|al jazeera|aljazeera|ap news|apnews|reuters|africanews|aujourd'hui|hier|récent|récemment)\b/i.test(
      q
    )
  ) {
    categories.push('africa_world_news');
  }

  if (
    mode === 'medicine' ||
    /\b(?:santé|sante|médecine|medecine|biologie|maladie|virus|bactérie|vaccin|symptôme|symptomes|traitement|oms|who|pasteur|nih|cdc|lancet|épidémie|cancer|diabète|paludisme|ebola|covid|hopital|hôpital|médical)\b/i.test(
      q
    )
  ) {
    categories.push('health_biology');
  }

  if (
    mode === 'study' ||
    /\b(?:science|sciences|scientifique|unesco|khan academy|khanacademy|coursera|edx|sciencedirect|nature|étude|études|recherche scientifique|biologie|physique|chimie|astronomie|climat)\b/i.test(
      q
    )
  ) {
    categories.push('science_education');
  }

  if (
    /\b(?:onu|un|nations unies|emploi|emplois|recrutement|volontaire|volontariat|humanitaire|ong|unv|jobs\.un|reliefweb|unjobs|undp|pnud|unicef|unhcr|ocha|poste|candidature)\b/i.test(
      q
    )
  ) {
    categories.push('un_jobs_humanitarian');
  }

  if (
    /\b(?:facebook|instagram|twitter|x\.com|youtube|threads|tiktok|coche bleue|compte officiel|réseau social|réseaux sociaux|cristiano|ronaldo)\b/i.test(
      q
    )
  ) {
    categories.push('official_social');
  }

  if (
    /\b(?:arnaque|arnaques|fraude|faux compte|whatsapp|gagnez 1 million|frais de dossier|payer pour|sans coche bleue|escroquerie)\b/i.test(
      q
    )
  ) {
    categories.push('anti_scam');
  }

  return Array.from(new Set(categories));
}

export function lookupChadPlateInfo(query: string): string | null {
  const q = (query || '').toLowerCase();
  const isPlateOrProvinceQuery =
    /\b(?:plaque|plaques|immatriculation|code|numéro|numero|province|provinces|tchad|chef-lieu)\b/i.test(
      q
    );

  if (!isPlateOrProvinceQuery) return null;

  const numMatches = [...q.matchAll(/\b(0?[1-9]|1\d|2[0-2])\b/g)].map((m) =>
    m[1].padStart(2, '0')
  );
  const directCodeMatches = CHAD_PLATES.filter((p) => numMatches.includes(p.code));

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasWholeWord = (text: string, term: string) => {
    const regex = new RegExp(
      `(?:^|[^a-zàâéèêîïôûùç0-9])${escapeRegExp(term.toLowerCase())}(?:$|[^a-zàâéèêîïôûùç0-9])`,
      'i'
    );
    return regex.test(text);
  };

  const nameMatches = CHAD_PLATES.filter(
    (p) =>
      hasWholeWord(q, p.province) ||
      (p.capital ? hasWholeWord(q, p.capital) : false)
  );

  const matched = Array.from(new Set([...directCodeMatches, ...nameMatches]));

  if (matched.length > 0) {
    return [
      '[BASE DE DONNÉES OFFICIELLE DE SAMRY IA — PLAQUES D’IMMATRICULATION DU TCHAD (VÉRITÉ ABSOLUE)]',
      'CONSIGNE IMPÉRATIVE : N’utilise JAMAIS ta mémoire interne pour les numéros de plaques du Tchad. Recopie EXACTEMENT les correspondances officielles ci-dessous :',
      ...matched.map((m) => `• ${m.label}`),
      'Référentiel complet des 22 codes (01 à 22) disponible sur demande.',
    ].join('\n');
  }

  return [
    '[BASE DE DONNÉES OFFICIELLE DE SAMRY IA — PLAQUES D’IMMATRICULATION DU TCHAD (01 à 22)]',
    'CONSIGNE IMPÉRATIVE : Utilise EXCLUSIVEMENT la liste officielle exacte ci-dessous :',
    ...CHAD_PLATES.map((p) => `• ${p.label}`),
  ].join('\n');
}
