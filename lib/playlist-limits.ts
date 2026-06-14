/** YouTube Mix / radio playlists (RD*) paginate without a practical end. */
export function isMixPlaylist(playlistId: string): boolean {
  return playlistId.startsWith("RD");
}

/** Max videos to load for a playlist type. */
export function getPlaylistVideoLimit(playlistId: string): number {
  if (isMixPlaylist(playlistId)) {
    return 200;
  }
  return 2000;
}

export const MAX_PLAYLIST_PAGES = 40;
