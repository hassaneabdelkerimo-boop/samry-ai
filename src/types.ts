export type SubjectMode =
  | 'general'
  | 'news'
  | 'study'
  | 'math'
  | 'medicine'
  | 'code'
  | 'writing'
  | 'translate';

export type LanguageCode =
  | 'auto'
  | 'fr'
  | 'en'
  | 'ar'
  | 'es'
  | 'de'
  | 'it'
  | 'pt'
  | 'zh'
  | 'ru'
  | 'tr';

export type ThinkingDepth = 'low' | 'medium' | 'high';

export interface Attachment {
  name: string;
  mimeType: string;
  size: number;
  base64: string; // data URL or base64 for binary files (PDF, images)
  textContent?: string; // extracted UTF-8 text for code/text/csv/json files
  previewUrl?: string;
  type: 'image' | 'pdf' | 'text';
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
  date?: string;
  siteName?: string;
}

export type ImageCategory = 'portrait' | 'landscape' | 'poster' | 'logo' | 'free';

export type ImageStyle =
  | 'photorealistic'
  | 'cinematic'
  | '3d_render'
  | 'digital_art'
  | 'anime'
  | 'vector_logo'
  | 'typography_poster'
  | 'oil_painting';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  attachment?: Attachment;
  generatedImageUrl?: string;
  imagePrompt?: string;
  imageCategory?: ImageCategory;
  imageStyle?: string;
  mode?: SubjectMode;
  modelUsed?: string;
  thinkingDepth?: ThinkingDepth;
  isStreaming?: boolean;
  isSearching?: boolean;
  isError?: boolean;
  requiresPaidKey?: boolean;
  sources?: GroundingSource[];
  enginesUsed?: string[];
  isGrounded?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: SubjectMode;
  messages: Message[];
}
