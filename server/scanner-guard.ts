const SCANNER_PATH_SEGMENTS = new Set([
  'adminer.php',
  'actuator',
  'boaform',
  'cgi-bin',
  'hnap1',
  'ms-edit.php',
  'phpinfo.php',
  'phpmyadmin',
  'phpmyadmin.php',
  'pma',
  'server-status',
  'wp-admin',
  'wp-admin.php',
  'wp-content',
  'wp-includes',
  'wp-config.php',
  'wp-login.php',
  'xmlrpc.php',
  '.git',
]);

export function isScannerProbePath(pathname: string): boolean {
  let decodedPath = pathname;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const decoded = decodeURIComponent(decodedPath);
      if (decoded === decodedPath) break;
      decodedPath = decoded;
    } catch {
      break;
    }
  }

  const normalizedPath = decodedPath.replace(/\\/g, '/').toLowerCase().replace(/\/+/g, '/');
  if (/^\/\.well-known(?:\/|$)/.test(normalizedPath)) return false;

  const segments = normalizedPath.split('/').filter(Boolean);
  return segments.some((segment) =>
    SCANNER_PATH_SEGMENTS.has(segment) ||
    segment === '.env' ||
    segment.startsWith('.env.') ||
    segment.startsWith('wp-config.php.')
  ) || segments.some((segment, index) => segment === 'vendor' && segments[index + 1] === 'phpunit');
}
