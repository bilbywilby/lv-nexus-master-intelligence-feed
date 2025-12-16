import { MongoClient } from 'mongodb';
// --- Mock Data Generator (ported from TS) ---
const CITIES = {
  Allentown: { lat: 40.6084, lon: -75.4902, streets: ['Hamilton St', 'Lehigh St', '7th St', 'Union Blvd', 'Tilghman St'] },
  Bethlehem: { lat: 40.6259, lon: -75.3705, streets: ['Main St', 'Broad St', '3rd St', 'Linden St', 'Elizabeth Ave'] },
  Easton: { lat: 40.6918, lon: -75.2218, streets: ['Northampton St', 'Larry Holmes Dr', '3rd St', 'College Ave', 'Cattell St'] },
};
const INCIDENT_TYPES = {
  'TRAFFIC': ['Accident', 'Road Closure', 'Congestion', 'Disabled Vehicle'],
  'EMERGENCY': ['Fire', 'Medical Assist', 'Police Activity', 'Structure Collapse'],
  'INFRASTRUCTURE': ['Power Outage', 'Water Main Break', 'Gas Leak', 'Signal Malfunction'],
  'WEATHER': ['Severe Thunderstorm', 'Flash Flood Warning', 'Tornado Watch', 'High Winds'],
};
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomCoords(base) {
  const radius = 0.05; // ~5km radius
  return {
    lat: base.lat + (Math.random() - 0.5) * radius * 2,
    lon: base.lon + (Math.random() - 0.5) * radius * 2,
  };
}
function generateMockFeedItem() {
  const cityKey = getRandomElement(Object.keys(CITIES));
  const city = CITIES[cityKey];
  const street = getRandomElement(city.streets);
  const location = `${Math.floor(Math.random() * 1200) + 100} ${street}, ${cityKey}`;
  const coords = getRandomCoords(city);
  const typeKey = getRandomElement(Object.keys(INCIDENT_TYPES));
  const subType = getRandomElement(INCIDENT_TYPES[typeKey]);
  const title = `${typeKey}: ${subType}`;
  const severity = getRandomElement(SEVERITIES);
  return {
    id: crypto.randomUUID(),
    type: typeKey,
    severity,
    title,
    location,
    coords,
    timestamp: Date.now() - Math.floor(Math.random() * 10000),
  };
}
// --- MongoDB Connection ---
let db;
if (process.env.MONGO_URL) {
  const client = new MongoClient(process.env.MONGO_URL);
  client.connect().then(() => {
    console.log('Connected to MongoDB');
    db = client.db();
  }).catch(err => console.error('MongoDB connection error:', err));
}
// --- In-Memory Feed Entity ---
const MAX_FEED_ITEMS = 50;
const INITIAL_FEED_STATE = {
  items: [],
  stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, eventsLastHour: new Array(60).fill(0) },
  config: { frequency: 2, chaos: false },
};
class InMemFeedEntity {
  constructor() {
    this.state = JSON.parse(JSON.stringify(INITIAL_FEED_STATE));
    this.collection = db ? db.collection('feed') : null;
    this.loadState();
  }
  async loadState() {
    if (!this.collection) return;
    const savedState = await this.collection.findOne({ _id: 'live' });
    if (savedState) {
      this.state = { ...this.state, ...savedState };
    }
  }
  async saveState() {
    if (!this.collection) return;
    await this.collection.updateOne({ _id: 'live' }, { $set: this.state }, { upsert: true });
  }
  updateStats(newItem) {
    this.state.stats.total += 1;
    switch (newItem.severity) {
      case 'Critical': this.state.stats.critical += 1; break;
      case 'High': this.state.stats.high += 1; break;
      case 'Medium': this.state.stats.medium += 1; break;
      case 'Low': this.state.stats.low += 1; break;
      case 'Info': this.state.stats.info += 1; break;
    }
    const currentMinute = new Date().getMinutes();
    this.state.stats.eventsLastHour[currentMinute] = (this.state.stats.eventsLastHour[currentMinute] || 0) + 1;
    const nextMinute = (currentMinute + 1) % 60;
    this.state.stats.eventsLastHour[nextMinute] = 0;
  }
  async getLatest() {
    let eventsToGenerate = this.state.config.frequency;
    if (this.state.config.chaos) {
      eventsToGenerate += Math.floor(Math.random() * 3);
    }
    if (eventsToGenerate > 0) {
      for (let i = 0; i < eventsToGenerate; i++) {
        const newItem = generateMockFeedItem();
        this.state.items.unshift(newItem);
        this.updateStats(newItem);
      }
      if (this.state.items.length > MAX_FEED_ITEMS) {
        this.state.items = this.state.items.slice(0, MAX_FEED_ITEMS);
      }
    }
    this.state.items.sort((a, b) => b.timestamp - a.timestamp);
    await this.saveState();
    return this.state;
  }
  async updateConfig(newConfig) {
    this.state.config = { ...this.state.config, ...newConfig };
    await this.saveState();
    return this.state.config;
  }
  async resetFeed() {
    const configToKeep = this.state.config;
    this.state = { ...JSON.parse(JSON.stringify(INITIAL_FEED_STATE)), config: configToKeep };
    await this.saveState();
    return this.state;
  }
  async addAutomationEvents(items) {
    for (const item of items) {
      this.state.items.unshift(item);
      this.updateStats(item);
    }
    if (this.state.items.length > MAX_FEED_ITEMS) {
      this.state.items = this.state.items.slice(0, MAX_FEED_ITEMS);
    }
    this.state.items.sort((a, b) => b.timestamp - a.timestamp);
    await this.saveState();
  }
}
// --- In-Memory Workflow Entity ---
class InMemWorkflowEntity {
  constructor() {
    this.workflows = [];
    this.collection = db ? db.collection('workflows') : null;
    this.loadWorkflows();
  }
  async loadWorkflows() {
    if (!this.collection) return;
    this.workflows = await this.collection.find({}).toArray();
  }
  async create(workflow) {
    const state = {
      id: crypto.randomUUID(),
      workflow,
      createdAt: Date.now(),
      scheduleIntervalMs: 3600000,
      enabled: false,
      lastRun: 0,
    };
    this.workflows.push(state);
    if (this.collection) await this.collection.insertOne(state);
    return state;
  }
  async list() {
    if (this.collection) {
        this.workflows = await this.collection.find({}).toArray();
    }
    return { items: this.workflows, next: null };
  }
  async findById(id) {
    return this.workflows.find(w => w.id === id);
  }
  async updateSchedule(id, updates) {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index > -1) {
      this.workflows[index] = { ...this.workflows[index], ...updates };
      if (this.collection) await this.collection.updateOne({ id }, { $set: updates });
    }
  }
  async dryRun(id, scheduled = false) {
    const results = [];
    const pdfUrls = ['https://example.com/report.pdf', 'https://example.com/analysis.pdf'];
    for (const url of pdfUrls) {
      const mockItem = generateMockFeedItem();
      const title = mockItem.title.toLowerCase();
      const summary = `AI Brief for Lehigh Valley ops: ${title}.`;
      results.push({
        ...mockItem,
        id: crypto.randomUUID(),
        type: 'AUTOMATION',
        severity: 'High',
        title: `${scheduled ? 'SCHEDULED: ' : ''}Automation PDF Intel: ${title}`,
        location: url,
        summary,
        actions: ['preview', 'download'],
        timestamp: Date.now(),
      });
    }
    if (results.length > 0) {
      await feedEntity.addAutomationEvents(results);
    }
    return { results, summary: `Dry run complete. Found ${results.length} items.` };
  }
  async simCron(workflow) {
    if (!workflow.enabled || !workflow.scheduleIntervalMs) return false;
    const now = Date.now();
    if (now - (workflow.lastRun || 0) > workflow.scheduleIntervalMs) {
      await this.dryRun(workflow.id, true);
      await this.updateSchedule(workflow.id, { lastRun: now });
      return true;
    }
    return false;
  }
}
// Singleton instances
export const feedEntity = new InMemFeedEntity();
export const workflowEntity = new InMemWorkflowEntity();
export async function simAllCrons() {
  for (const wf of workflowEntity.workflows) {
    await workflowEntity.simCron(wf);
  }
}