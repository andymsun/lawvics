# Bug Log & Post-Mortem

This document serves as a historical record of bugs, mistakes, and their resolutions. Refer to this log to avoid repeating past errors.

## Format
When logging a new issue, use the following format:
```markdown
### [Date] [Issue Title]
*   **Description**: Brief description of the bug or mistake.
*   **Cause**: Root cause (if known).
*   **Resolution**: How it was fixed.
*   **Lesson**: What we learned to prevent recurrence.
```

---

## Resolved Issues

### 2026-01-24 Dashboard Updates Not Reflecting
*   **Description**: Matrix view, Analytics page, and History tab were not updating or displaying correct data.
*   **Cause**: Connectivity or state synchronization issues between the global store and the specific view components.
*   **Resolution**: Debugged the data flow in `DashboardSidebar`, `SurveyHistory`, and Views. ensured distinct state updates trigger re-renders.
*   **Lesson**: Always verify that state subscriptions in components are correctly hooked up to the global store updates.

### 2026-01-24 Settings Page Errors
*   **Description**: Errors encountered when accessing the Settings page.
*   **Resolution**: Fixed component rendering logic or missing props in the Settings view.

### 2026-01-21 Tutorial Interaction Issues
*   **Description**: Elements within the tutorial overlay were unclickable.
*   **Cause**: Overlay `z-index` or pointer-event handling was blocking interaction with highlighted elements.
*   **Resolution**: Implemented a robust interaction locking mechanism that promotes highlighted elements above the overlay.
*   **Lesson**: When creating overlays, carefully manage `z-index` and `pointer-events` to ensure the "hole" in the overlay is truly interactive.

### 2026-01-21 UI Polish & Dark Mode
*   **Description**: Background dimming missing in tutorial; Header title not adapting to dark mode; unwanted scrollbars.
*   **Resolution**:
    *   Restored dimming effect.
    *   Added dark mode conditional styling to header.
    *   Applied `overflow: hidden` to body and managed internal scrolling.
*   **Lesson**: Test UI changes in both Light and Dark modes. "Zero Scrollbar" layouts require careful `height: 100vh` management on the root container.

### 2026-01-13 Map Interactivity
*   **Description**: Map was static and hard to navigate.
*   **Resolution**: Implemented `react-simple-maps` with `ZoomableGroup` to allow pan/zoom.
*   **Lesson**: For data-dense visualizations like a 50-state map, zoom/pan interaction is critical for usability.
