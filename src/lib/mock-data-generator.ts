import type { GeoLocation, Severity } from '@shared/types';
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
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info'];
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomCoords(base: GeoLocation): GeoLocation {
  const radius = 0.05; // ~5km radius
  return {
    lat: base.lat + (Math.random() - 0.5) * radius * 2,
    lon: base.lon + (Math.random() - 0.5) * radius * 2,
  };
}
export function generateMockFeedItem() {
  const cityKey = getRandomElement(Object.keys(CITIES)) as keyof typeof CITIES;
  const city = CITIES[cityKey];
  const street = getRandomElement(city.streets);
  const location = `${Math.floor(Math.random() * 1200) + 100} ${street}, ${cityKey}`;
  const coords = getRandomCoords(city);
  const typeKey = getRandomElement(Object.keys(INCIDENT_TYPES)) as keyof typeof INCIDENT_TYPES;
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
    timestamp: Date.now() - Math.floor(Math.random() * 10000), // within last 10s
  };
}