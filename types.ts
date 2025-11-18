export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  label?: string;
  indexLabel?: string;
  content: ContentBlock[];
  audioSrc?: string;
}

export type ContentType = 'paragraph' | 'verse' | 'heading' | 'quote' | 'separator' | 'emphasis' | 'code-block' | 'scripture-line';

export interface ContentBlock {
  type: ContentType;
  text: string;
}