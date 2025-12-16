import { IndexedEntity } from "./core-utils";
import type { FeedItem, FeedStats } from "@shared/types";
import { generateMockFeedItem } from "../src/lib/mock-data-generator";
const MAX_FEED_ITEMS = 50;
export type FeedState = {
  id: string; // Should be a singleton, e.g., "live"
  items: FeedItem[];
  stats: FeedStats;
};
export class FeedEntity extends IndexedEntity<FeedState> {
  static readonly entityName = "feed";
  static readonly indexName = "feeds";
  static readonly initialState: FeedState = {
    id: "live",
    items: [],
    stats: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      eventsLastHour: new Array(60).fill(0),
    },
  };
  // This is a singleton, so we'll hardcode the ID
  constructor(env: Env) {
    super(env, "live");
  }
  private updateStats(state: FeedState, newItem: FeedItem): FeedState {
    const newStats = { ...state.stats };
    newStats.total += 1;
    switch (newItem.severity) {
      case 'Critical': newStats.critical += 1; break;
      case 'High': newStats.high += 1; break;
      case 'Medium': newStats.medium += 1; break;
      case 'Low': newStats.low += 1; break;
      case 'Info': newStats.info += 1; break;
    }
    const now = new Date();
    const currentMinute = now.getMinutes();
    newStats.eventsLastHour[currentMinute] = (newStats.eventsLastHour[currentMinute] || 0) + 1;
    // Clear the next minute's data to keep the array representing the last hour
    const nextMinute = (currentMinute + 1) % 60;
    newStats.eventsLastHour[nextMinute] = 0;
    return { ...state, stats: newStats };
  }
  async getLatest(): Promise<FeedState> {
    let state = await this.getState();
    // Simulate new events on read
    const eventsToGenerate = Math.floor(Math.random() * 4); // 0 to 3 new events
    if (eventsToGenerate > 0) {
      state = await this.mutate(currentState => {
        let newState = { ...currentState };
        for (let i = 0; i < eventsToGenerate; i++) {
          const newItem = generateMockFeedItem();
          newState.items.unshift(newItem);
          newState = this.updateStats(newState, newItem);
        }
        // Trim the items array
        if (newState.items.length > MAX_FEED_ITEMS) {
          newState.items = newState.items.slice(0, MAX_FEED_ITEMS);
        }
        return newState;
      });
    }
    // Ensure items are sorted by timestamp descending
    state.items.sort((a, b) => b.timestamp - a.timestamp);
    return state;
  }
  async resetFeed(): Promise<FeedState> {
    const Ctor = this.constructor as typeof FeedEntity;
    await this.save(Ctor.initialState);
    return Ctor.initialState;
  }
}