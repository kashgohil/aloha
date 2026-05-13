// LinkedIn's REST API (api.linkedin.com/rest/*) is versioned monthly in
// yyyymm form and requires the version on every request via the
// `LinkedIn-Version` header. LinkedIn keeps a rolling ~12-month window
// of supported versions; older ones get rejected with
// `NONEXISTENT_VERSION` (HTTP 426).
//
// Bump this constant when LinkedIn starts 426-ing engagement / comments
// / readback calls. The legacy /v2/* endpoints used by the publishers
// don't require this header, so publishing isn't affected by drift here.
export const LINKEDIN_API_VERSION = "202604";
