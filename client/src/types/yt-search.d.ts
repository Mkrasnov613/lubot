declare module "yt-search" {
  export type YtSearchVideo = {
    videoId: string;
    title: string;
    seconds: number;
    thumbnail: string;
    url: string;
    live?: boolean;
    isShorts?: boolean;
    author?: {
      name?: string;
    };
  };

  export type YtSearchResult = {
    videos?: YtSearchVideo[];
  };

  export function ytSearch(query: string): Promise<YtSearchResult>;
}
