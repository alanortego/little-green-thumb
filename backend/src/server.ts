import { getDb } from './db/connection.js';
import { createApp } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createApp(getDb());

app.listen(PORT, () => {
  console.log(`little-green-thumb backend listening on http://localhost:${PORT}`);
});
