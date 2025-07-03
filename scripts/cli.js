import { Command } from 'commander';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const program = new Command();
program.name('reddit-cli').description('Query Reddit ETL database').version('0.1.0');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

program
  .command('search-term <words...>')
  .description('Find posts whose titles include one or more words')
  .option('-m, --match <mode>', '“all” (default) or “any”', 'all')
  .action(async (words, opts) => {
    const terms = words.map(w => w.toLowerCase());
    const isAny = opts.match.toLowerCase() === 'any';

    let sql, params;
    if (isAny) {
      sql = `
        SELECT DISTINCT p.title, p.author,
               to_char(p.created_utc, 'YYYY-MM-DD HH24:MI') AS created
          FROM posts p
          JOIN terms t ON p.id = t.post_id
         WHERE t.term = ANY($1)
         ORDER BY created DESC
         LIMIT 50;
      `;
      params = [terms];
    } else {
      sql = `
        SELECT p.title, p.author,
               to_char(p.created_utc, 'YYYY-MM-DD HH24:MI') AS created
          FROM posts p
          JOIN terms t ON p.id = t.post_id
         WHERE t.term = ANY($1)
         GROUP BY p.id, p.title, p.author, p.created_utc
        HAVING COUNT(DISTINCT t.term) = $2
        ORDER BY p.created_utc DESC
        LIMIT 50;
      `;
      params = [terms, terms.length];
    }

    const { rows } = await client.query(sql, params);
    console.table(rows);
    await client.end();
  });

program.parseAsync(process.argv).catch(async err => {
  console.error('CLI error:', err);
  await client.end();
  process.exit(1);
});
