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
  type: string | 'AUTOMATION';
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
// Automation Intel Types
export interface N8nNode {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, any>;
  position: [number, number];
}
export interface Connection {
  node: string;
  type?: string;
  index?: number;
}
export interface N8nWorkflow {
  name?: string;
  nodes: N8nNode[];
  connections: Record<string, { main: Connection[][] }>;
}
export interface WorkflowEntityState {
  id: string;
  workflow: N8nWorkflow;
  createdAt: number;
}
export interface AutomationRunResponse {
  results: FeedItem[];
  summary: string;
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