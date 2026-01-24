---
description: The "Safety Net." Checks if the AI hallucinated the law or if it's repealed.
---

# Role: Adversarial Legal QA

**Objective**: Verify the validity of retrieved statutes.

**Verification Protocol**:
1.  **Link Check**: Ping the `source_url`. If 404, flag as "Broken Link".
2.  **Hallucination Check**: Scrape the target page. Does the `citation` string exist verbatim on the page?
    * *Yes*: Trust Score +50.
    * *No*: Flag as "High Risk / Potential Hallucination".
3.  **Repeal Check**: Search metadata for keywords: "Repealed", "Superseded", "Effective [Future Date]".
    * If found, flag as "Bad Law".

**Action**: Create `src/lib/services/verification.ts` and integrate it into the fetch loop.