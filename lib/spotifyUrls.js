// lib/spotifyUrls.js

/**
 * Baut gültige Spotify Embed- & Open-URLs
 * Priorität:
 * 1) spotify_id
 * 2) spotify_link (bereinigt um locale)
 * 3) Fallback: Suche
 */
export function getSpotifyUrls({ spotify_id, spotify_link, title, artist }) {
    // 1) Spotify-ID vorhanden
    if (spotify_id && /^[A-Za-z0-9]{22}$/.test(spotify_id)) {
      return {
        embedUrl: `https://open.spotify.com/embed/album/${spotify_id}`,
        openUrl: `https://open.spotify.com/album/${spotify_id}`,
      };
    }
  
    // 2) Spotify-Link vorhanden → ID extrahieren
    if (spotify_link) {
      const cleanLink = spotify_link.replace(/\/intl-[a-z-]+\//, "/");
      const match = cleanLink.match(/album\/([A-Za-z0-9]{22})/);
  
      if (match) {
        const id = match[1];
        return {
          embedUrl: `https://open.spotify.com/embed/album/${id}`,
          openUrl: `https://open.spotify.com/album/${id}`,
        };
      }
    }
  
    // 3) Fallback: Suche
    const q = encodeURIComponent(`${title ?? ""} ${artist ?? ""}`.trim());
    return {
      embedUrl: `https://open.spotify.com/embed/search/${q}`,
      openUrl: `https://open.spotify.com/search/${q}`,
    };
  }
  