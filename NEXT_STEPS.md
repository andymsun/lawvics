# Next Steps

The MVP is live and the UI is functional. Here is the roadmap for the next sprint:

1.  **Integrate Crawlee**:
    *   Replace the mock `setTimeout` in `orchestrator.ts` with real `PlaywrightCrawler` calls.
    *   Set up a `route.ts` API handler to run these on the server (Next.js logic).

2.  **Enhance Map Logic**:
    *   Implement proper propery matching (FIPS or Name matching) in `InteractiveMap.tsx` to colorize specific states accurately based on the store.

3.  **Result Details View**:
    *   Create a side panel or modal that opens when a user clicks a state on the map to show the full `Statute` text and `verification_status`.

4.  **Real LLM Integration**:
    *   Connect `auditor.ts` to OpenAI via Vercel AI SDK to perform semantic verification (not just schema validation).
