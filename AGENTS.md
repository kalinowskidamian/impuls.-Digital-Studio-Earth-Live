# Agent instructions — Modern Web Guidance (QA)

Modern Web Guidance: https://github.com/GoogleChrome/modern-web-guidance

For changes involving HTML, CSS, browser APIs, accessibility, animations, navigation, web performance or client-side JavaScript:
1. Before implementing, consult the relevant Modern Web Guidance guide. On an environment with Node.js and npm:
   - `npx -y modern-web-guidance@latest search "responsive navigation drawer"`
   - `npx -y modern-web-guidance@latest retrieve "<guide-id>"`
2. Prefer native platform features with progressive enhancement and reasonable cross-browser fallbacks; verify browser compatibility before adopting new syntax.
3. Respect `prefers-reduced-motion`, keyboard navigation, focus, screen readers, and small touch screens.
4. Preserve the visual identity, working interactions, i18n, and deployed paths. Avoid adding production dependencies for features available natively.
5. Run the repository's existing tests and QA validation before any merge. Never deploy directly to production as part of this audit.

The QA branch has a dedicated GitHub Actions workflow (`.github/workflows/modern-web-guidance-qa.yml`) that installs the CLI on the hosted runner and publishes the complete `legacy-scan` output as an artifact. The tool is NOT bundled into production browser assets.
