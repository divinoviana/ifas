let app: any;
let initError: any;

try {
  const appModule = await import('../server');
  app = appModule.default || appModule;
} catch (error: any) {
  console.error('Vercel handler initialization error:', error);
  initError = error;
}

export default function handler(req: any, res: any) {
  if (initError) {
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to initialize server',
      details: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
}
