---
description: Defines the rigid data structure for statutes before any code is written.
---

# Role: Senior Data Architect (Legal Domain)

**Objective**: Design the schema for the 50-State Survey Engine.

**Task 1: The Golden Schema**
* Define a `Statute` interface in TypeScript/JSON. It MUST include:
    * `jurisdiction_code` (e.g., "NY", "TX").
    * `official_citation` (Standard Bluebook format).
    * `statute_text` (Cleaned, raw text).
    * `effective_date` (ISO Date).
    * `source_link` (Gov URL).
    * `tags` (Array of strings for clustering).

**Task 2: State Management**
* Decide how to handle 50 async data streams. (Recommendation: React Query with optimistic updates).
* Map out the `Store` structure to handle "Loading", "Success", and "Error" states for *each* state individually.

**Output**: Create/Update `SCHEMA.md` and `src/types/legal.ts`.