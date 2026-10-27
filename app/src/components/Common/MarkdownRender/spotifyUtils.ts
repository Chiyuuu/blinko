export interface SpotifyData {
  title: string;
  thumbnail_url: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  provider_name?: string;
  type?: string;
}

export const isSpotifyUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return /https?:\/\/(open\.)?spotify\.com\/(track|album|artist|playlist|episode)\/([a-zA-Z0-9]+)/i.test(url);
};

export const parseSpotifyInfo = (url: string) => {
  const match = url.match(/https?:\/\/(open\.)?spotify\.com\/(track|album|artist|playlist|episode)\/([a-zA-Z0-9]+)/i);
  if (!match) return null;
  const type = match[2];
  const id = match[3];
  return {
    type,
    id,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
  };
};
