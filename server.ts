import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
