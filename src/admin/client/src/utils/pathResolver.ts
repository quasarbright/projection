/**
 * Resolves admin:// prefixed paths to actual URLs for the admin interface
 */
export function resolveAdminPath(path: string | undefined | null): string | null {
  if (!path || path === '') {
    return null;
  }

  // If it starts with admin://, resolve to /screenshots/
  if (path.startsWith('admin://')) {
    const filename = path.substring(8); // Remove 'admin://' prefix
    return `/screenshots/${filename}`;
  }

  // Return as-is for other paths
  return path;
}
