# Modern Web Guidance — agent instructions (QA)

For any frontend HTML/CSS/JavaScript change, consult the applicable official Modern Web Guidance patterns: https://github.com/GoogleChrome/modern-web-guidance.

Prefer native browser APIs, progressive enhancement, accessibility, reduced motion, and tested cross-browser fallbacks. Preserve Earth Live's globe rotation, marker stability, hover pause/resume, touch interaction, PL/EN localization, and mobile scrolling. Do not replace WebGL interactions or remove fallback behavior without regression testing.

The QA workflow at `.github/workflows/modern-web-audit.yml` runs the official `modern-web-guidance legacy-scan .` and saves the output as an artifact. No audit-only changes may be deployed to main without explicit approval.
