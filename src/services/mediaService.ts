import { readJSON, writeJSON } from './storage'

export interface MediaItem {
  id: string
  url: string
  name: string
  type: 'image' | 'video' | 'audio'
  credit?: string
  license?: string
  uploadedAt: number
  tags: string[]
}

export interface AudioTrack {
  id: string
  title: string
  artist: string
  radioStation: string
  url?: string
  duration: number
}

export interface VideoChapter {
  time: number
  label: string
}

export function getAllMedia(): MediaItem[] {
  return readJSON<MediaItem[]>('media_items', [])
}

export function addMedia(item: Omit<MediaItem, 'id' | 'uploadedAt'>): MediaItem {
  const entry: MediaItem = { ...item, id: crypto.randomUUID(), uploadedAt: Date.now() }
  writeJSON('media_items', [...getAllMedia(), entry])
  return entry
}

export function removeMedia(id: string): void {
  writeJSON('media_items', getAllMedia().filter(m => m.id !== id))
}

export function getVideoChapters(videoId: string): VideoChapter[] {
  const all = readJSON<Record<string, VideoChapter[]>>('video_chapters', {})
  return all[videoId] ?? []
}

export function setVideoChapters(videoId: string, chapters: VideoChapter[]): void {
  const all = readJSON<Record<string, VideoChapter[]>>('video_chapters', {})
  writeJSON('video_chapters', { ...all, [videoId]: chapters })
}

export const MOCK_AUDIO_TRACKS: AudioTrack[] = [
  { id: 'track-1', title: 'Vice City Nights', artist: 'Lazlow', radioStation: 'Flash FM', duration: 215 },
  { id: 'track-2', title: 'Running with the Night', artist: 'Lionel Richie', radioStation: 'Flash FM', duration: 238 },
  { id: 'track-3', title: 'Waiting for a Girl Like You', artist: 'Foreigner', radioStation: 'Emotion 98.3', duration: 264 },
  { id: 'track-4', title: 'Take On Me', artist: 'a-ha', radioStation: 'V-Rock', duration: 225 },
  { id: 'track-5', title: 'Sunglasses at Night', artist: 'Corey Hart', radioStation: 'Fever 105', duration: 214 },
  { id: 'track-6', title: 'Owner of a Lonely Heart', artist: 'Yes', radioStation: 'K-Chat', duration: 239 },
]

export function getNowPlaying(): AudioTrack | null {
  return readJSON<AudioTrack | null>('now_playing', null)
}

export function setNowPlaying(track: AudioTrack | null): void {
  writeJSON('now_playing', track)
}
