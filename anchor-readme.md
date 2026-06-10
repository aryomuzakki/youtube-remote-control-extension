> todo: update readme and project to this for v0.1.0

> **REPOSITORY CONTEXT:** This is a universal, mirrored README shared across all repositories in this architecture. To understand the exact role of the codebase you are currently viewing, look at the `"name"` field in this repository's `package.json` file, then match it to the corresponding section under **Repository Specific Rules & Constraints** below.

---

# YouTube Serverless Remote Controller (Cross-Repo Anchor)

This project is a multi-repository system designed to seamlessly control YouTube playback across devices. To handle both persistent room states and hyper-fast remote control execution, the system employs a **CQRS (Command Query Responsibility Segregation) Hybrid Architecture**.

We split the data flow into two distinct pipelines:

1. **State & Storage (Supabase):** The persistent ledger that handles room creation, host availability, and security.
2. **Real-Time Events (Convex):** The lightning-fast, ephemeral pipe used strictly to shoot execution commands to the extension.

## 📑 Table of Contents

- [The Hybrid Architecture & Data Flow](#️the-hybrid-architecture--data-flow)
  - [Phase A: The Handshake (State Flow)](#phase-a-the-handshake-state-flow)
  - [Phase B: The Remote Control (Command Flow)](#phase-b-the-remote-control-command-flow)
- [Shared Contract: Database Schemas](#️shared-contract-database-schemas)
  - [1. Supabase (The State Ledger)](#1-supabase-the-state-ledger)
  - [2. Convex (The Command Pipe)](#2-convex-the-command-pipe)
- [Repository Specific Rules & Constraints](#repository-specific-rules--constraints)
  - [1. ytrc-extension (WXT Chrome Extension)](#1-ytrc-extension-wxt-chrome-extension)
  - [2. ytrc-web (External Frontend UI)](#2-ytrc-web-external-frontend-ui)
  - [3. ytrc-server (External Bridge Server)](#3-ytrc-server-external-bridge-server)

---

## The Hybrid Architecture & Data Flow

```mermaid
graph TD
    %% The State Flow (Supabase)
    Ext[ytrc-extension] -- 1. Request Room --> Srv[ytrc-server]
    Srv -- 2. Create Room State --> Supa[(Supabase: rooms)]
    Web[ytrc-web] -- 3. Validate Room & Status --> Supa

    %% The Command Flow (Convex)
    Web -- 4. Send Command Mutation --> Conv[(Convex: commands)]
    Conv -- 5. Live Stream Event --> Ext
    Ext -- 6. IPC DOM Control --> YT[YouTube DOM]

    style Ext fill:#0052cc,stroke:#333,stroke-width:2px,color:#fff
    style Web fill:#000000,stroke:#333,stroke-width:2px,color:#fff
    style Srv fill:#2b9048,stroke:#333,stroke-width:2px,color:#fff
    style Supa fill:#3ecf8e,stroke:#333,stroke-width:2px,color:#111
    style Conv fill:#ff5a5f,stroke:#333,stroke-width:2px,color:#fff
    style YT fill:#ff0000,stroke:#333,stroke-width:2px,color:#fff
```

![](https://mermaid.ink/img/pako:eNqdlEuPmzAQx7-K5WirRiKIZx4-9EK2UqVGrTZRV9mQg4FhQQs4NSaPjfLda5sEsT218cmemf9vPOPHGccsAUzwK6e7DK3mIQ8rJMfDA1plgJaCCkBfC3ZAn5fNjka0huEt5vEoNifB4xEcBVR1zqotGo2QbaIn-N1ALdATY6U0fUFLvm9Da-B74NsbQtqVxDFRwEGl0oo2q9bJnJsuM0FcuuthJ3-GqMUeINK5XRP9okWedKhPGtbUHU1J_yoyYGVJq-RaZsCqPRyHvRQK7JloCTLmFrtoJFZWrLlKsrkKCYrbkN42lUdBfBN9z_eqq7LYEj3uoRIaIDvZa6oKHZvo288AzX8slFpwVujA9WqzZs2qiUC5tv1ianEqQMvTvCjIwLJ8J46NWmrfgAxc173OR4c8ERlxdkcjZgXjZJCm6UeKKvpGUeM-ijrcluJEM8ub3kmRh3bFuBCnU_gnjG3bHzH6DFpMmvrUT-_bzXrVQf6nMdiQLyxPMBG8AQOXwEuqlvis4CEWGZQQYiKnCeVvIQ6ri9TsaPUib_FNxlnzmmGS0qKWq2anrvk8p_Ltlp2Vy1sKPGBNJTCZzjQDkzM-YjKzzLHrzGzbdb2J50wcA5-k1TdVJa7ne55jj8eTi4HfdVLLnE58qzdsA0OSC8YX7aeh_47LHyhJWyE?type=png)

### Phase A: The Handshake (State Flow)

- The **WXT Extension** boots and pings the **Server**: _"Generate a Room for me."_
- The **Server** creates a row in **Supabase** and returns the `roomId`.
- The **Web Client** connects via URL (e.g., `?room=123`) and queries **Supabase** to validate the room exists and the extension is currently enabled.

### Phase B: The Remote Control (Command Flow)

- The **Web Client** pushes a command intent (`"PAUSE"`) into the **Convex** `commands` table.
- **Convex** instantly streams the update to the **WXT Extension's** headless background worker.
- The **WXT Extension** validates the timestamp and executes the DOM manipulation on the YouTube tab.

---

## Shared Contract: Database Schemas

To maintain absolute strict synchronization across all repositories, the following data schemas must be respected.

### 1. Supabase (The State Ledger)

Table: `rooms`

- `roomId` (String, Primary Key): e.g., "A7F9-2B"
- `status` (Enum): `"WAITING" | "REQUESTING_ACCESS" | "CONNECTED"`
- `extensionEnabled` (Boolean): Updates to false if the user disables the extension locally.
- `nowPlaying` (JSONB / Object): Holds current YouTube title/URL metadata.

### 2. Convex (The Command Pipe)

Table: `commands`

- `roomId` (String, Indexed): Must match the Supabase `roomId`.
- `action` (String): Allowed literals: `"PLAY"`, `"PAUSE"`, `"NEXT"`, `"PREV"`, `"OPEN_LINK"`.
- `url` (String, Optional): The targeted YouTube destination when action is `"OPEN_LINK"`.
- `target` (String, Optional): `"NEW_TAB" | "CURRENT_TAB"`.
- `timestamp` (Number): Unix epoch milliseconds (`Date.now()`).

---

---

# Repository Specific Rules & Constraints

_When working in a specific codebase, the AI and developer must adhere to the rules below._

## 1. `ytrc-extension` (WXT Chrome Extension)

**Role:** The headless receiver and DOM manipulator.

- **Framework:** WXT with React & TypeScript.
- **NO UI Providers in Background:** The service worker (`background.ts`) has no `window` or `document` context. You **cannot** use standard React-dependent hooks like `useQuery`.
- **Headless Convex Client Only:** You must strictly pull the real-time stream using the vanilla connector: `import { ConvexClient } from "convex/browser";`.
- **Keep-Alive Loop Required:** Manifest V3 workers sleep after ~30 seconds. You must utilize the `chrome.alarms` API to pulse periodically and keep the `convex.onUpdate` listener alive.
- **Idempotency Check:** Always compare incoming Convex event timestamps against an in-memory `lastExecutedTimestamp` to avoid executing stale history items when the script re-awakens.
- **Link Validation:** Validate any `"OPEN_LINK"` payloads (e.g., ensure it matches `*://*.youtube.com/*`) before execution.

## 2. `ytrc-web` (External Frontend UI)

**Role:** The remote control interface (smartphone UI).

- **Framework:** Next.js or Vite React.
- **Read from Supabase, Write to Convex:** Use the Supabase client to fetch room state and metadata (`nowPlaying`). Use standard `@convex/react` wrappers and `useMutation` to push interaction commands.
- **Payload Strictness:** Every mutation fired through `api.commands.send` must conform exactly to the Convex schema outlined above.
- **UI Locking:** If the Supabase query returns `extensionEnabled: false` or `status: "WAITING"`, the web UI must lock/gray out the control buttons to prevent wasteful mutations.

## 3. `ytrc-server` (External Bridge Server)

**Role:** The lightweight state manager.

- **Framework:** Node.js/Hono or Go.
- **Primary Function:** Receives the initialization ping from the extension, generates secure/unique `roomId`s, and performs the database insertion into Supabase securely (keeping Supabase service roles/secrets out of the bundled extension code).
- **Stateless:** This server does _not_ manage long-lived WebSockets. It strictly handles standard HTTP/REST requests to bridge the extension to the persistent database.
