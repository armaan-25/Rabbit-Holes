# Legacy backend prototype

Rabbit Holes staging is local-first: the extension captures browsing metadata locally, the web app reads it through the extension bridge, and AI calls go directly to the user's configured provider.

This FastAPI backend is kept only as a legacy prototype/reference for future optional cloud sync or hosted services. It is not required for the core extension-first product.

Do not add new core product dependencies on this backend unless the feature is explicitly optional sync, backup, sharing, or self-hosted infrastructure.
