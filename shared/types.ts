export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export interface GeoLocation {
  lat: number;
  lon: number;
}
export interface FeedItem {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  location: string;
  coords: GeoLocation;
  timestamp: number;
}
export interface FeedStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  eventsLastHour: number[];
}
export interface FeedConfig {
  frequency: number;
  chaos: boolean;
}
export interface LiveFeedResponse {
  items: FeedItem[];
  stats: FeedStats;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}