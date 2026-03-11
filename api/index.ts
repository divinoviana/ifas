import appModule from '../server';

const app = (appModule as any).default || appModule;

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
