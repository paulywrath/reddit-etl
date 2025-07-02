import dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import { fetchPage } from './reddit.js';

async function ingest() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let after = null;
  do {
    const { children: posts, after: next } = await fetchPage({ after });
    if (!posts.length) break;

    console.log(`Ingesting batch of ${posts.length} posts…`);

    for (const post of posts) {
      await client.query(
        `INSERT INTO posts(id, title, author, created_utc, raw_json)
         VALUES($1,$2,$3,to_timestamp($4),$5)
         ON CONFLICT (id) DO NOTHING`,
        [post.id, post.title, post.author, post.created_utc, post]
      );

      // 2) Tokenize title
      const words = post.title.match(/\w+/g)?.map(w => w.toLowerCase()) || [];
      for (const w of words) {
        await client.query(
          `INSERT INTO terms(post_id, term) VALUES($1,$2)`,
          [post.id, w]
        );
      }
    }

    after = next;
  } while (after);

  const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM posts;');
  console.log('Total posts in DB:', rows[0].cnt);

  await client.end();
}

ingest().catch(err => {
  console.error('ETL failed:', err);
  process.exit(1);
});
