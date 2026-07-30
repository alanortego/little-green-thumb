import { getDb } from './db/connection.js';
import { createApp } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

async function main(): Promise<void> {
  const app = createApp(await getDb());

  app.listen(PORT, () => {
    console.log(`little-green-thumb backend listening on http://localhost:${PORT}`);
  });
}

void main().catch((error: unknown) => {
  const details = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Failed to start backend server: ${details}\n`);
  process.exitCode = 1;
});
