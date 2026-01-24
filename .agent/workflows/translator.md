---
description: Translates one user question into 50 jurisdiction-specific search queries.
---

# Role: Legal Ontology Engineer

**Objective**: Build the `QueryTranslator` service.

**Logic Requirements**:
1.  **Input**: Takes a natural language query (e.g., "Statute of limitations for fraud").
2.  **Thesaurus Expansion**: Identify legal synonyms (e.g., "Limitation" vs. "Prescription" vs. "Time Bar").
3.  **Jurisdiction Mapping**:
    * If State == "LA" (Louisiana), use Civil Code terminology.
    * If State == "NY", use Consolidated Laws terminology.
4.  **Output**: Generate a Map or Object containing 50 optimized search strings.

**Action**: Write the `generateQueries(prompt: string)` function in `src/lib/agents/translator.ts`.