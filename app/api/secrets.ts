import { readFileSync } from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log(process.cwd());
    const secretsPath = path.join(process.cwd(), 'secrets.json');
    const secrets = JSON.parse(readFileSync(secretsPath, 'utf8'));
    res.status(200).json(secrets);
  } catch (error) {
    console.error('Error reading secrets:', error);
    res.status(500).json({ error: 'Failed to read secrets' });
  }
}