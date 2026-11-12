const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createApp } = require('../backend.cjs');

fs.mkdirSync(path.join(__dirname,'../.document-work'),{recursive:true});

test('accounts, ownership, publication snapshots, revocation and persistence', async () => {
  const dataDir = fs.mkdtempSync(path.join(__dirname, '../.document-work/backend-test-'));
  let app = createApp({ dataDir });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  let base = `http://127.0.0.1:${app.address().port}`;
  async function request(route, method = 'GET', body, cookie, extra = {}) {
    const response = await fetch(base + route, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-Pgy-Request': '1', Origin: base } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], cookieHeader: response.headers.get('set-cookie') };
  }
  try {
    assert.equal((await request('/api/gifts')).status, 401);
    const a = await request('/api/auth/register', 'POST', { username: 'alice', displayName: '阿梨', password: 'test-password-123' });
    assert.equal(a.status, 201); assert.match(a.cookieHeader, /HttpOnly/); assert.match(a.cookieHeader, /SameSite=Lax/);
    const alice = a.cookie;
    assert.equal((await request('/api/auth/register', 'POST', { username: 'ALICE', displayName: '重复', password: 'test-password-123' })).status, 409);
    assert.equal((await request('/api/auth/login', 'POST', { username: 'alice', password: 'wrong-password' })).status, 401);
    const b = await request('/api/auth/register', 'POST', { username: 'bob', displayName: '小博', password: 'test-password-456' });
    const bob = b.cookie;
    const gift = { kind: 'words', title: '原来的礼物', author: '阿梨', words: '最初的祝福', photos: [], design: {background:'midnight',font:'kai',opening:'cord',paper:'vintage',tree:'sakura',color:'#e7bc61',glow:65,ending:'愿你热爱',music:''}, theme: 'forest', zoom: 85, transition: 'fade' };
    assert.equal((await request('/api/gifts', 'POST', { gift }, alice, { Origin: 'https://bad.example' })).status, 403);
    assert.equal((await request('/api/gifts', 'POST', { gift }, alice, { 'X-Pgy-Request': '' })).status, 403);
    const saved = await request('/api/gifts', 'POST', { gift }, alice);
    assert.equal(saved.status, 201); assert.equal(saved.body.gift.token, null);
    const id = saved.body.gift.id;
    for (const [method, suffix, body] of [['GET', '', undefined], ['DELETE', '', undefined], ['PUT', '', { gift, revision: 1 }], ['POST', '/publish', { revision: 1 }], ['POST', '/stop', {}]]) assert.equal((await request('/api/gifts/' + id + suffix, method, body, bob)).status, 404);
    const published = await request('/api/gifts/' + id + '/publish', 'POST', { revision: 1 }, alice);
    assert.equal(published.status, 200); assert.equal((await request('/api/public/' + published.body.gift.token)).body.gift.design.opening,'cord');
    const token = published.body.gift.token;
    assert.equal((await request('/api/public/' + token)).body.gift.words, '最初的祝福');
    const edits = await Promise.all([request('/api/gifts/' + id, 'PUT', { gift: { ...gift, words: '新祝福' }, revision: 1 }, alice), request('/api/gifts/' + id, 'PUT', { gift: { ...gift, words: '新祝福' }, revision: 1 }, alice)]);
    assert.deepEqual(edits.map(r => r.status).sort(), [200, 409]);
    assert.equal((await request('/api/public/' + token)).body.gift.words, '最初的祝福');
    assert.equal((await request('/api/gifts/' + id + '/publish', 'POST', { revision: 1 }, alice)).status, 409);
    assert.equal((await request('/api/gifts/' + id + '/publish', 'POST', { revision: 2 }, alice)).body.url, published.body.url);
    assert.equal((await request('/api/public/' + token)).body.gift.words, '新祝福');
    assert.equal((await request('/api/gifts/' + id + '/stop', 'POST', {}, alice)).status, 200);
    assert.equal((await request('/api/public/' + token)).status, 404);
    assert.equal((await request('/api/gifts/' + id + '/publish', 'POST', { revision: 2 }, alice)).status, 200);
    assert.equal((await request('/api/profile', 'PUT', { displayName: '新的昵称' }, alice)).body.user.displayName, '新的昵称');
    assert.equal((await request('/api/gifts', 'POST', { gift: { ...gift, kind: 'album', photos: [{ src: 'data:image/svg+xml;base64,PHN2Zz4=', name: 'x' }] } }, alice)).status, 400);
    await new Promise(resolve => app.close(resolve));
    app = createApp({ dataDir }); await new Promise(resolve => app.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${app.address().port}`;
    assert.equal((await request('/api/auth/me', 'GET', undefined, alice)).body.user.displayName, '新的昵称');
    assert.equal((await request('/api/public/' + token)).body.gift.words, '新祝福');
    assert.equal((await request('/api/gifts/' + id, 'DELETE', undefined, alice)).status, 200);
    assert.equal((await request('/api/public/' + token)).status, 404);
    const change = await request('/api/auth/password', 'POST', { currentPassword: 'test-password-123', newPassword: 'changed-password-123' }, alice);
    assert.equal(change.status, 200);
    assert.equal((await request('/api/auth/me', 'GET', undefined, alice)).status, 401);
    assert.equal((await request('/api/auth/login', 'POST', { username: 'alice', password: 'test-password-123' })).status, 401);
    const login = await request('/api/auth/login', 'POST', { username: 'alice', password: 'changed-password-123' });
    assert.equal(login.status, 200);
    await request('/api/auth/logout', 'POST', {}, login.cookie);
    assert.equal((await request('/api/auth/me', 'GET', undefined, login.cookie)).status, 401);
  } finally { await new Promise(resolve => app.close(resolve)); }
});

