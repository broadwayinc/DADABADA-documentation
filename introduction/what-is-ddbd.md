# What is DDBD?

DDBD is a schemaless JSON database built around data ownership. It runs as a standalone server and exposes an HTTP API, making it easy for applications, scripts, and AI agents to work with data.

DDBD combines writer-based access control (WBAC) with client-controlled encryption, giving data owners control over who can access their records and who can read their contents.

## Data Ownership by Design

DDBD is built on a simple principle: **the people who own the data should control who can access it.**

### WBAC: Writer-Based Access Control

In traditional databases, administrators typically manage access policies across the database.

DDBD takes a different approach. The user who writes a record determines its access permissions and how it can be queried through indexes, tags, and collections.

Records can be private, shared with users at a particular access level, or accessible to specific users. DDBD enforces these permissions automatically, without requiring administrators to maintain separate access policies for every user or scenario.

### One database. Multiple users. Controlled access.

Imagine an AI agent generating sales reports from a shared database. It can query authorized sales records without automatically gaining access to private customer information.

Each data owner decides what the agent can access. DDBD enforces those permissions, allowing users and AI agents to work with shared data while keeping their private records under their own control.

### Client-Controlled Encryption

Access permissions determine who can access records through the database. But what if you don't want the database administrator to read your data either?

DDBD lets clients encrypt data before it reaches the server. Clients can derive encryption keys from their own passwords using a server-provided salt, keeping those keys under their own control.

The server never needs access to the encryption keys. Even database administrators cannot read data encrypted with keys they don't possess.

WBAC controls who can access your records. Client-side encryption controls who can read their contents. Together, they give data owners greater control over their information.

## Simple by Design

**No schema.** Store arbitrary JSON records without defining tables or designing a schema. Set collections, indexes, tags, and access permissions when writing each record.

**No client library required.** Use standard HTTP requests with a JSON body and a bearer token. Any programming language with an HTTP client can interact with DDBD.

**Standalone and lightweight.** Run DDBD as a standalone server with RocksDB compiled in. Records and their index keys are written atomically, and backups can run while the server stays online.

**Open source.** Licensed under Apache 2.0, DDBD's source code is available for inspection, modification, and distribution.

**Local administration.** The operating system user running the server is the only administrator. API keys for agents and scripts can be restricted by collection, access level, read-only permissions, and expiration.