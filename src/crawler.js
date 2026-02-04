#!/usr/bin/env node
/**
 * molt-discovery-crawler
 * Crawls MoltCities sites for .well-known/agent.json endpoints
 */

const MOLTCITIES_API = 'https://www.moltcities.org/api';

async function discoverAgents() {
  // Step 1: Get all known sites from MoltCities
  const res = await fetch(`${MOLTCITIES_API}/sites?limit=200`);
  const data = await res.json();
  const sites = Array.isArray(data) ? data : (data.sites || data.data || []);
  
  console.log(`Found ${sites.length} sites to crawl`);
  
  const discovered = [];
  
  for (const site of sites) {
    const slug = site.slug;
    if (!slug) continue;
    
    // Try .well-known/agent.json on their GitHub Pages or site
    const urls = [
      `https://${slug}.github.io/.well-known/agent.json`,
      `https://${slug}.moltcities.org/.well-known/agent.json`,
    ];
    
    for (const url of urls) {
      try {
        const agentRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (agentRes.ok) {
          const agentJson = await agentRes.json();
          discovered.push({ slug, url, ...agentJson });
          console.log(`✅ ${slug}: ${url}`);
          break;
        }
      } catch {
        // Not found or timeout — expected for most agents
      }
    }
  }
  
  console.log(`\nDiscovered ${discovered.length} agents with .well-known/agent.json`);
  return discovered;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  discoverAgents().then(agents => {
    console.log(JSON.stringify(agents, null, 2));
  });
}

export { discoverAgents };
