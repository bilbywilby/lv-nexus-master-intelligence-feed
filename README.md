# LV-Nexus: Master Intelligence Feed
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/lv-nexus-master-intelligence-feed)
## 🌟 Project Overview
**LV-Nexus** (`lv-nexus`) is a high-fidelity, real-time situational awareness dashboard designed for the Lehigh Valley region. It aggregates disparate intelligence streams—traffic incidents, emergency services dispatch, weather anomalies, and infrastructure status—into a unified, geo-spatial 'Single Pane of Glass'.
The system utilizes Cloudflare Durable Objects for its primary deployment, maintaining a consistent, synchronized state of the 'region' and acting as a high-speed indexer. The frontend is a visually stunning, information-dense 'Mission Control' interface featuring a live scrolling intelligence feed, an interactive geo-spatial visualization, and real-time metric sparklines. An alternative standalone deployment using Fastify, Docker, and MongoDB is also supported for local development and private hosting.
**Key differentiator**: Powered by Cloudflare's edge network for sub-50ms global latency, with a 'Cyberpunk Analyst' glassmorphism UI that delivers mission-critical insights.
**Target audience**: Emergency responders, urban planners, infrastructure operators, and analysts requiring real-time regional intelligence.
**Elevator pitch**: LV-Nexus transforms fragmented Lehigh Valley data sources into an immersive, real-time command center—where every alert, heatmap pulse, and sparkline update happens instantly at the edge.
## 📋 Project Status
- **Current version**: `v2.1.0`
- **Maturity level**: **Stable** (Production-Ready)
- **Maintenance status**: **Active**
- **Compatibility**: Modern browsers; Cloudflare Workers runtime or Node.js environment via Docker.
## 🚀 Features & Capabilities
### Core Features
- **Holo-Map**: Interactive geo-spatial visualization with heatmaps for Allentown, Bethlehem, and Easton.
- **Live Intelligence Stream**: High-velocity scrolling feed with severity-coded events and AI-enhancement badges.
- **Analytic Widgets**: Real-time sparklines and trend cards for incident rates.
- **Command Center Dashboard**: Bento-grid layout with glassmorphism panels and a unified navigation header.
- **Intelligence Index**: A dense, searchable, and filterable tabular view of all events with raw JSON inspection.
- **Automation Intel**: A visual workflow builder (n8n-inspired) to create and schedule automated intelligence gathering tasks (e.g., scanning sitemaps for new PDF reports).
- **System Configuration**: UI to control simulation parameters (event frequency, chaos mode) and manage mock API keys.
### Advanced Capabilities
- **Dual Deployment Architecture**: Can be deployed globally on Cloudflare's edge network or as a self-hosted Fastify/Docker application.
- **Geo-Distributed State (Cloudflare)**: A single Durable Object (`FeedEntity`) ensures consistent, low-latency data across edge locations.
- **Persistent State (Docker)**: Optionally connects to a MongoDB instance for state persistence across container restarts.
- **AI-Enhanced Events**: Automation workflows can generate events with AI-generated summaries and actionable links (e.g., PDF reports).
- **Interactive Polish**: Hover-linked map/feed sync, slide-out details panes, boot animations, and a consistent cyberpunk aesthetic.
## 🏗️ Architecture
LV-Nexus supports two primary deployment models:
1.  **Cloudflare Edge (Recommended for Production)**: Maximum performance, scalability, and low latency.
    ```ascii
    [Client Browser] <---HTTPS---> [Cloudflare Edge]
                                        |
                                    [Hono Worker]
                                        |
                            [GlobalDurableObject (State)]
    ```
2.  **Docker / Fastify (for Local Development or Self-Hosting)**: Full-featured local environment.
    ```ascii
    [Client Browser] <---HTTP---> [Docker Container]
                                        |
                                 [Fastify Server]
                                        |
                        [In-Memory State / MongoDB (Optional)]
    ```
## 🔧 Installation & Deployment
### Prerequisites
- [Bun](https://bun.sh/) 1.0+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) 3.19.0+ (for Cloudflare deployment)
- [Docker](https://www.docker.com/get-started) & Docker Compose (for local deployment)
---
### 🚀 Option 1: Deploy to Cloudflare Workers (Recommended)
This method deploys the application to Cloudflare's global network for the best performance.
```bash
# 1. Clone the repository
git clone <your-repo-url> lv-nexus
cd lv-nexus
# 2. Install dependencies
bun install
# 3. Authenticate with Cloudflare
wrangler login
# 4. Deploy the application
bun deploy
```
Your application will be live at the URL provided by Wrangler.
---
### 🖥️ Option 2: Run Locally with Docker & Fastify
This method runs the entire stack (React UI + Fastify API) locally using Docker Compose. It's ideal for development or self-hosting.
```bash
# 1. Clone the repository
git clone <your-repo-url> lv-nexus
cd lv-nexus
# 2. Create an environment file
cp .env.example .env
# 3. Build the React frontend
bun install
bun build
# 4. Start the services
docker-compose up --build
```
The application will be available at `http://localhost:3000`. The API server runs inside the container, and the React app is served as a static asset. To enable data persistence between restarts, uncomment the `MONGO_URL` in your `.env` file.
## 🖥️ Usage & Configuration
### API Endpoints
All endpoints are prefixed with `/api`.
- `GET /api/feed/live`: Fetch the latest events and statistics.
- `POST /api/feed/reset`: Resets the simulation state.
- `GET /api/feed/config`: Get current simulation config.
- `POST /api/feed/config`: Update simulation config (`{ frequency: number, chaos: boolean }`).
- `GET /api/automation/workflows`: List all automation workflows.
- `POST /api/automation/workflows`: Import a new workflow from n8n-compatible JSON.
- `POST /api/automation/run/:id`: Manually trigger a workflow run.
- `POST /api/automation/workflows/:id/schedule`: Update a workflow's schedule.
### User Journey
1.  Land on the **Command Center** to see a live overview.
2.  Click an event in the feed or on the map to open a **Drill-Down Sheet** with detailed information.
3.  Navigate to the **Intelligence Index** to search and filter through all historical events.
4.  Visit the **Automation** view to inspect, run, or schedule intelligence-gathering workflows.
5.  Go to the **Config** page to tune the simulation's speed and chaos level.
## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/your-amazing-feature`.
3.  Install dependencies: `bun install`.
4.  Make your changes.
5.  Commit your changes: `git commit -m 'Add some amazing feature'`.
6.  Push to the branch: `git push origin feature/your-amazing-feature`.
7.  Open a Pull Request.
## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
---
**Project ID**: `lv-nexus` | **Built with ❤️ at Cloudflare**