const baseUrl = (process.env.SMOKE_BASE_URL || 'https://andreasandreou.gr').replace(/\/$/, '');

async function check(path, expectedStatuses, expectedLocation) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${path}: expected ${expectedStatuses.join(' or ')}, received ${response.status}`);
  }
  if (expectedLocation && !response.headers.get('location')?.includes(expectedLocation)) {
    throw new Error(`${path}: expected Location containing ${expectedLocation}`);
  }
  console.log(`ok ${response.status} ${path}`);
}

await check('/', [200]);
await check('/articles', [200]);
await check('/robots.txt', [200]);
await check('/sitemap.xml', [200]);
await check('/admin', [302], '/admin/login');
await check('/auth/session', [401]);
await check('/auth/signout', [302], '/admin/login');
