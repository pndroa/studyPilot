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

---

## Local Data

All local files (uploads) are stored in:

```
next-app/data/
└── uploads/    # User documents for RAG
```
