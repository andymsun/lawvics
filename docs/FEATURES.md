# Features Documentation

This document serves as a comprehensive guide to the current features of the Lawvics application. It is intended for future AI agents and developers to understand the system's capabilities and architecture.

## Core Agents (`src/lib/agents/`)

The application powers its legal research through three primary autonomous agents:

### 1. Translator Agent (`translator.ts`)
*   **Purpose**: Converts natural language user queries into precise boolean search strings optimized for legal databases.
*   **Functionality**: Takes a user's question (e.g., "What is the statute of limitations for fraud in Texas?") and generates specific query strings for all 50 states if necessary, or targeted jurisdictions.

### 2. Orchestrator Agent (`orchestrator.ts`)
*   **Purpose**: Manages the "Swarm" of parallel requests.
*   **Functionality**:
    *   Handles concurrent API calls to legal data sources.
    *   Implements rate limiting and error handling to prevent blocking.
    *   Aggregates results from multiple jurisdictions.

### 3. Auditor Agent (`auditor.ts`)
*   **Purpose**: Verifies the accuracy and validity of retrieved statutes.
*   **Functionality**:
    *   Performs "Shepardizing" (verifying if law is good law).
    *   Checks effective dates and source URLs.
    *   Ensures 0% hallucination rate by cross-referencing citations.

## User Interface (`src/components/`)

### Dashboard (`src/components/dashboard/`)
The command center for the user.
*   **DashboardSidebar**: Navigation menu for accessing different views (Search, History, Settings).
*   **ActivityDropdown**: Displays recent user activities or active background, "swarming" tasks.
*   **ReportModal**: A detailed view for examining specific search results or generated reports.
*   **SurveyHistory**: A log of past research queries and their results.
*   **Views**:
    *   **Matrix View**: A grid-based comparison of statutes across states.
    *   **Analytics View**: Visual data representation of research findings.

### Interactive Map (`src/components/map/`)
*   **Purpose**: Visualizes legal research results across the US geography.
*   **Functionality**:
    *   Dynamic coloring based on statute attributes (e.g., Statute length, severity, existence).
    *   Interactive states allowing users to drill down into specific jurisdiction details.

## Workflows
The application uses defined workflows for standardized operations:
*   **Swarm**: The main research loop triggering the agents.
*   **Auditor**: The verification loop.
*   **Translator**: The query generation loop.

## Data Schema
*   **Statute**: The core data unit, defined in `SCHEMA.md`, ensuring all retrieved laws follow a strict structure for consistency.
