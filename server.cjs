const { createApp } = require('./backend.cjs');
const port = Number(process.env.PORT) || 4175;
const host = process.env.HOST || '127.0.0.1';
if(process.env.NODE_ENV==='production'&&!/^https:\/\//.test(process.env.PUBLIC_ORIGIN||''))throw Error('正式运行请先设置 HTTPS PUBLIC_ORIGIN。');
const app = createApp();
app.listen(port, host, () => console.log(`Pagetoyou: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.close(() => process.exit(0)));
