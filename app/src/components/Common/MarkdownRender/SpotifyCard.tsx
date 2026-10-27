import React, { useEffect, useState, useMemo } from 'react';
import { isSpotifyUrl, parseSpotifyInfo, SpotifyData } from './spotifyUtils';

// In-memory cache across component mounts
const spotifyCache = new Map<string, SpotifyData>();

interface SpotifyCardProps {
  url: string;
  isInline?: boolean;
}

export const SpotifyCard: React.FC<SpotifyCardProps> = ({ url, isInline = false }) => {
  const [data, setData] = useState<SpotifyData | null>(() => spotifyCache.get(url) || null);
  const [loading, setLoading] = useState<boolean>(!spotifyCache.has(url));
  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const parsed = useMemo(() => parseSpotifyInfo(url), [url]);

  useEffect(() => {
    if (!url || !parsed) return;
    if (spotifyCache.has(url)) {
      setData(spotifyCache.get(url)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchOEmbed = async () => {
      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SpotifyData = await res.json();
        spotifyCache.set(url, json);
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to fetch Spotify oEmbed:', err);
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      }
    };

    fetchOEmbed();
    return () => {
      isMounted = false;
    };
  }, [url, parsed]);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If inline format is requested
  if (isInline) {
    return (
      <span
        onClick={handleCardClick}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 my-0.5 rounded-full text-xs font-medium bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20 cursor-pointer select-none transition-colors border border-[#1DB954]/20 align-middle"
        title={data?.title || 'Spotify 音乐'}
      >
        <span className="w-3.5 h-3.5 inline-flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.353-.674.465-1.027.25-2.812-1.718-6.353-2.107-10.523-1.155-.403.092-.803-.162-.895-.565-.092-.403.162-.803.565-.895 4.57-1.043 8.486-.595 11.63 1.338.353.215.465.674.25 1.027zm1.464-3.256c-.27.44-.847.58-1.287.31-3.22-1.98-8.13-2.55-11.94-1.39-.496.15-1.022-.13-1.173-.627-.15-.497.13-1.023.627-1.174 4.35-1.32 9.77-.69 13.463 1.594.44.27.58.847.31 1.287zm.126-3.41c-3.86-2.29-10.23-2.5-13.91-1.38-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.23-1.28 11.28-1.04 15.72 1.6.53.31.71 1 .39 1.54-.31.53-1 .71-1.55.39z"/>
          </svg>
        </span>
        <span className="truncate max-w-[200px]">{data?.title || 'Spotify 播放链接'}</span>
      </span>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-md my-2 p-3 rounded-2xl border border-default-200 bg-secondbackground flex items-center gap-3 animate-pulse select-none">
        <div className="w-16 h-16 rounded-xl bg-default-300 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-default-300 rounded w-3/4" />
          <div className="h-3 bg-default-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Fallback to iframe if oEmbed fails or player toggled
  if (showPlayer || hasError) {
    return (
      <div className="w-full max-w-md my-2 rounded-2xl overflow-hidden border border-default-200 shadow-sm bg-secondbackground">
        {parsed && (
          <iframe
            src={parsed.embedUrl}
            width="100%"
            height={parsed.type === 'track' ? '152' : '352'}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl"
          />
        )}
        <div className="flex justify-between items-center px-3 py-1.5 bg-secondbackground text-xs text-default-500">
          <span className="flex items-center gap-1 font-medium text-[#1DB954]">
            <svg viewBox="0 0 24 24" fill="#1DB954" className="w-3.5 h-3.5">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.353-.674.465-1.027.25-2.812-1.718-6.353-2.107-10.523-1.155-.403.092-.803-.162-.895-.565-.092-.403.162-.803.565-.895 4.57-1.043 8.486-.595 11.63 1.338.353.215.465.674.25 1.027zm1.464-3.256c-.27.44-.847.58-1.287.31-3.22-1.98-8.13-2.55-11.94-1.39-.496.15-1.022-.13-1.173-.627-.15-.497.13-1.023.627-1.174 4.35-1.32 9.77-.69 13.463 1.594.44.27.58.847.31 1.287zm.126-3.41c-3.86-2.29-10.23-2.5-13.91-1.38-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.23-1.28 11.28-1.04 15.72 1.6.53.31.71 1 .39 1.54-.31.53-1 .71-1.55.39z"/>
            </svg>
            Spotify
          </span>
          {showPlayer && (
            <button
              onClick={() => setShowPlayer(false)}
              className="text-primary hover:underline cursor-pointer"
            >
              收起播放器
            </button>
          )}
        </div>
      </div>
    );
  }

  const typeName = {
    track: '单曲',
    album: '专辑',
    artist: '歌手',
    playlist: '歌单',
    episode: '播客',
  }[parsed?.type || 'track'] || '音乐';

  return (
    <div
      onClick={handleCardClick}
      className="w-full max-w-md my-2 p-2.5 rounded-2xl border border-default-200/80 bg-secondbackground hover:bg-default-100/80 transition-all shadow-sm hover:shadow group cursor-pointer select-none"
    >
      <div className="flex items-center gap-3">
        {/* Album Cover */}
        <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-sm bg-black/10">
          {data?.thumbnail_url ? (
            <img
              src={data.thumbnail_url}
              alt={data?.title || 'Spotify Cover'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white">
              <svg viewBox="0 0 24 24" fill="#1DB954" className="w-8 h-8">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.353-.674.465-1.027.25-2.812-1.718-6.353-2.107-10.523-1.155-.403.092-.803-.162-.895-.565-.092-.403.162-.803.565-.895 4.57-1.043 8.486-.595 11.63 1.338.353.215.465.674.25 1.027zm1.464-3.256c-.27.44-.847.58-1.287.31-3.22-1.98-8.13-2.55-11.94-1.39-.496.15-1.022-.13-1.173-.627-.15-.497.13-1.023.627-1.174 4.35-1.32 9.77-.69 13.463 1.594.44.27.58.847.31 1.287zm.126-3.41c-3.86-2.29-10.23-2.5-13.91-1.38-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.23-1.28 11.28-1.04 15.72 1.6.53.31.71 1 .39 1.54-.31.53-1 .71-1.55.39z"/>
              </svg>
            </div>
          )}
          {/* Subtle Spotify play badge on hover */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1DB954]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.353-.674.465-1.027.25-2.812-1.718-6.353-2.107-10.523-1.155-.403.092-.803-.162-.895-.565-.092-.403.162-.803.565-.895 4.57-1.043 8.486-.595 11.63 1.338.353.215.465.674.25 1.027zm1.464-3.256c-.27.44-.847.58-1.287.31-3.22-1.98-8.13-2.55-11.94-1.39-.496.15-1.022-.13-1.173-.627-.15-.497.13-1.023.627-1.174 4.35-1.32 9.77-.69 13.463 1.594.44.27.58.847.31 1.287zm.126-3.41c-3.86-2.29-10.23-2.5-13.91-1.38-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.23-1.28 11.28-1.04 15.72 1.6.53.31.71 1 .39 1.54-.31.53-1 .71-1.55.39z"/>
              </svg>
              Spotify
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-default-200/70 text-default-600 font-medium">
              {typeName}
            </span>
          </div>

          <div
            className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors"
            title={data?.title}
          >
            {data?.title || '未知曲目'}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-default-500 hover:text-primary flex items-center gap-0.5">
              前往收听
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-default-300 text-xs">•</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPlayer(true);
              }}
              className="text-xs text-[#1DB954] hover:underline cursor-pointer"
            >
              嵌入播放
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
