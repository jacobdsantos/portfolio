export interface SearchItem {
  type: 'blog' | 'research' | 'tool' | 'page';
  title: string;
  excerpt: string;
  tags: string[];
  url: string;
  keywords?: string[];
}

export interface SearchIndex {
  version: number;
  generatedAt: string;
  items: SearchItem[];
}
