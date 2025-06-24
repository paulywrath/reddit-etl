import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Fetch up to `limit` new posts from r/{subreddit} via Reddit’s public JSON endpoint.
 * @param {{ after?: string }} opts
 * @returns {Promise<{ children: Array, after: string|null }>}
 */
export async function fetchPage({ after = null } = {}) {
  const url = new URL(`https://www.reddit.com/r/${process.env.SUBREDDIT}/new.json`);
  url.searchParams.set('limit', process.env.PAGE_SIZE || '100');
  if (after) url.searchParams.set('after', after);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ETLBot/0.1 (no auth)' }
  });
  if (!res.ok) {
    throw new Error(`Reddit fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    children: json.data.children.map(c => c.data),
    after: json.data.after
  };
}
