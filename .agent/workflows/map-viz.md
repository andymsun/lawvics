---
description: Builds the interactive US Map that colors states based on the data.
---

# Role: Data Visualization Specialist

**Objective**: Build the `InteractiveMap` component.

**Requirements**:
1.  **Library**: Use `react-simple-maps` or `D3`.
2.  **Dynamic Coloring**:
    * Accept a `colorScale` function.
    * If 50 states return data, auto-cluster them (e.g., 30 states are "2 Years" [Blue], 5 states are "3 Years" [Green]).
3.  **Performance**: Memoize the map. Only re-render the specific state path when its data arrives (streaming updates).
4.  **Interaction**:
    * Hover: Show tooltip summary.
    * Click: Open side panel with full statute text.

**Action**: create `src/components/map/USMap.tsx`.