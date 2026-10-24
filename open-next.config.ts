import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// CostPacket runs on Cloudflare Workers via the OpenNext adapter.
// The app is mostly dynamic (authenticated Neon reads), so no incremental
// cache is configured yet. To enable ISR/data-cache later, wire an R2
// incremental cache here, e.g.:
//   import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
//   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
export default defineCloudflareConfig()
