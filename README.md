# ACP Demos

A collection of five interactive demos showing AI agents controlling real web UIs through the [Agent Control Protocol (ACP)](https://github.com/agent-control-protocol/acp).

Each demo is a self-contained Node.js server + browser UI. The agent reads a manifest describing the page, accepts natural language from the user, and emits structured commands (`set_field`, `click`, `navigate`, ...) that the browser executes with visual feedback.

## The demos

| Demo | What it shows | Run | URL |
|---|---|---|---|
| **travel-planner** | Multi-step itinerary form, dropdowns, computed totals | `npm run travel` | http://localhost:3100 |
| **incident-response** | Ops dashboard — triage, assign, escalate via chat | `npm run incident` | http://localhost:3102 |
| **quiz-builder** | Dynamic form building (add/remove questions) | `npm run quiz` | http://localhost:3104 |
| **budget-wizard** | Wizard with screen transitions, validation, summary | `npm run budget` | http://localhost:3106 |
| **emissor-nfse** | Brazilian NFS-e issuer (in Portuguese) — realistic tax form | `npm run nfse` | http://localhost:3108 |

Each demo uses two ports: the HTTP port above for the UI, and the next port up for the ACP WebSocket (e.g. budget-wizard: 3106 HTTP, 3107 WS).

## Quick start

```bash
git clone https://github.com/agent-control-protocol/acp-demos.git
cd acp-demos
npm install
cp .env.example .env       # add your API key
npm run travel             # or: incident, quiz, budget, nfse
```

The `.env` file only needs:

```
OPENAI_API_KEY=sk-your-key-here
```

## Using other LLM providers

Any OpenAI-compatible API works:

```bash
OPENAI_API_KEY=sk-... \
OPENAI_BASE_URL=https://api.deepseek.com \
ACP_MODEL=deepseek-chat \
npm run travel
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | *(required)* | API key for the LLM provider |
| `OPENAI_BASE_URL` | OpenAI | Base URL for OpenAI-compatible APIs |
| `ACP_MODEL` | `gpt-4o` | Model name |
| `ACP_PORT` | per demo | WebSocket port for the ACP server |
| `ACP_HTTP_PORT` | per demo | HTTP port for the demo UI |

## Related

- [acp-demo](https://github.com/agent-control-protocol/acp-demo) — the original single-demo (pet registration) starter
- [ACP Specification](https://github.com/agent-control-protocol/acp) — protocol spec, JSON Schema, examples
- [ACP Reference Server](https://github.com/agent-control-protocol/acp-server) — `npm install @acprotocol/server`
- [acp-protocol.org](https://acp-protocol.org) — project website

## License

Apache 2.0
