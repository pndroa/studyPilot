# StudyPilot

**StudyPilot** is a project within the _LLM-Supported Software Development_ course. It focuses on applying **Large Language Models (LLMs)** to assist in software development processes.

---

## Tech Stack

- **Next.js (TypeScript)** – Fullstack framework (UI + API routes)
- **LangChain.js** – LLM orchestration and RAG (Retrieval-Augmented Generation)
- **Redis** – Local vector database for document storage and embeddings
- **Electron** – Desktop wrapper for Next.js, providing a native app experience
- **LLMs supported:** OpenAI, Ollama, and Google Gemini

---

## Installation & Setup

### Prerequisites

Make sure you have installed:

- **Node.js** ≥ 20
- **npm** ≥ 10
- (optional) **Python 3.11+** – required by ChromaDB
- (optional) **Ollama** – for running local LLMs

---

### Clone the Repository

```bash
git clone <your-repo-url>
cd studyPilot
```

---

### Install Dependencies

Install dependencies for both Next.js and Electron:

```bash
npm install --prefix next-app
npm install --prefix electron
npm install
```

---

### Configure Environment Variables

The Next.js app expects a `.env.local` file inside `next-app/`. Create the file if it does not exist and add the Redis connection string:

```
REDIS_URL=redis://:studypilot-local@127.0.0.1:6379
```

---

### Run Redis with Docker Compose

A ready-to-use Redis setup lives in `next-app/docker/redis/docker-compose.yml`:
Start the container locally from the same directory:

```bash
cd next-app/docker/redis
docker compose up -d
```

---

### Start the App (Development Mode)

Run both Next.js and Electron together:

```bash
npm run desktop
```

This command will:

- Start the **Next.js development server** at `http://localhost:3000`
- Open an **Electron window** that displays your app as a desktop application

---

### Build for Production

To build both parts:

```bash
npm run build
```

Then start the built version:

```bash
npm start
```

Or build the Electron app as a standalone `.exe` / `.dmg` / `.AppImage`:

```bash
cd electron
npx electron-builder
```

### Use Ollama for Offline LLMs

- Install and start [Ollama](https://ollama.com/) locally (default endpoint: `http://127.0.0.1:11434`).
- Optional: set `OLLAMA_BASE_URL` in `next-app/.env.local` if you use a different host/port.
- In the StudyPilot UI, open the **Ollama** section to test the connection and send prompts to local models such as `llama3` or `mistral`.
