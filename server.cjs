const { createApp } = require('./backend.cjs');
const port = Number(process.env.PORT) || 4175;
const host = process.env.HOST || '127.0.0.1';
const app = createApp();
app.listen(port, host, () => console.log(`Pagetoyou: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.close(() => process.exit(0)));
