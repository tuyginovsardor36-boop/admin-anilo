
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Multer setup for memory storage
  const upload = multer({ storage: multer.memoryStorage() });

  // Proxy endpoint for TechMentor Upload
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Fayl topilmadi' });
      }

      const apiUrl = process.env.VITE_CODEUSTA_API_URL || 'https://api.techmentor.uz';
      const projectName = (process.env.VITE_CODEUSTA_PROJECT_NAME || 'anilo').toLowerCase().trim();
      const bucketId = (process.env.VITE_CODEUSTA_BUCKET_ID || 'anilo').toString().trim();
      const apiKey = process.env.VITE_CODEUSTA_API_KEY || 
                     process.env.VITE_CODEUSTA_API || 
                     process.env.VITE_CODEUSTA_API_KEY_STORAGE;

      if (!apiKey) {
        return res.status(500).json({ error: 'API Key sozlanmagan' });
      }

      // TechMentor API talabi: https://api.techmentor.uz/{project_name}/{bucket_name}/
      // Oxiridagi slash (/) juda muhim, aks holda 405 xatosi chiqishi mumkin.
      const targetUrl = `${apiUrl.replace(/\/$/, '')}/${projectName}/${bucketId}/`;
      
      console.log(`Proxying upload to: ${targetUrl}`);
      console.log(`Project: ${projectName}, Bucket: ${bucketId}`);

      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(targetUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': apiKey
        },
        // Progress tracking for large files
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Proxy Upload Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
