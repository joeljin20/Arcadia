import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { ImageAnnotatorClient } from '@google-cloud/vision';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

app.post('/api/vision/bic-pen', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const [result] = await visionClient.labelDetection({
      image: { content: imageBase64 },
    });

    const labels = (result.labelAnnotations || []).map(l =>
      (l.description || '').toLowerCase()
    );

    const penKeywords = ['pen', 'ballpoint pen', 'writing instrument', 'office supplies', 'stationery'];
    const hasPen = labels.some(label => penKeywords.some(kw => label.includes(kw)));

    res.json({ result: hasPen ? 'YES' : 'NO', labels });
  } catch (err: any) {
    console.error('Cloud Vision error:', err.message);
    res.status(500).json({ error: 'Vision analysis failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
