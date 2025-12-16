import { IndexedEntity } from "./core-utils";
import type { FeedItem, FeedStats, Severity } from "@shared/types";
import { generateMockFeedItem } from "../src/lib/mock-data-generator";
import type { Env } from './core-utils';
const MAX_FEED_ITEMS = 50;
export interface FeedConfig {
  frequency: number; // 0-5
  chaos: boolean;
}
export type FeedState = {
  id: string; // Should be a singleton, e.g., "live"
  items: FeedItem[];
  stats: FeedStats;
  config: FeedConfig;
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
    config: {
      frequency: 2,
      chaos: false,
    },
  };
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
    const nextMinute = (currentMinute + 1) % 60;
    newStats.eventsLastHour[nextMinute] = 0;
    return { ...state, stats: newStats };
  }
  async getConfig(): Promise<FeedConfig> {
    const state = await this.getState();
    return state.config || FeedEntity.initialState.config;
  }
  async updateConfig(newConfig: Partial<FeedConfig>): Promise<FeedConfig> {
    return this.mutate(s => {
      const updatedConfig = { ...s.config, ...newConfig };
      return { ...s, config: updatedConfig };
    }).then(s => s.config);
  }
  async getLatest(): Promise<FeedState> {
    let state = await this.getState();
    const config = state.config || FeedEntity.initialState.config;
    let eventsToGenerate = config.frequency;
    if (config.chaos) {
      eventsToGenerate += Math.floor(Math.random() * 3); // Add 0-2 extra events in chaos mode
    }
    if (eventsToGenerate > 0) {
      state = await this.mutate(currentState => {
        let newState = { ...currentState };
        for (let i = 0; i < eventsToGenerate; i++) {
          const newItem = generateMockFeedItem();
          if (config.chaos && Math.random() > 0.5) { // 50% chance to upgrade severity
            const severities: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info'];
            const currentIdx = severities.indexOf(newItem.severity);
            if (currentIdx > 0) {
              newItem.severity = severities[currentIdx - 1];
            }
          }
          newState.items.unshift(newItem);
          newState = this.updateStats(newState, newItem);
        }
        if (newState.items.length > MAX_FEED_ITEMS) {
          newState.items = newState.items.slice(0, MAX_FEED_ITEMS);
        }
        return newState;
      });
    }
    state.items.sort((a, b) => b.timestamp - a.timestamp);
    return state;
  }
  async resetFeed(): Promise<FeedState> {
    const Ctor = this.constructor as typeof FeedEntity;
    const currentState = await this.getState();
    const configToKeep = currentState.config || Ctor.initialState.config;
    const freshState = { ...Ctor.initialState, config: configToKeep };
    await this.save(freshState);
    return freshState;
  }
  async addAutomationEvents(items: FeedItem[]): Promise<void> {
    await this.mutate(state => {
      let newState = { ...state };
      for (const item of items) {
        newState.items.unshift(item);
        newState = this.updateStats(newState, item);
      }
      if (newState.items.length > MAX_FEED_ITEMS) {
        newState.items = newState.items.slice(0, MAX_FEED_ITEMS);
      }
      newState.items.sort((a, b) => b.timestamp - a.timestamp);
      return newState;
    });
  }
}