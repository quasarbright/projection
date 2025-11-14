import { resolveAdminPath } from '../../src/admin/client/src/utils/pathResolver';

describe('pathResolver', () => {
  describe('resolveAdminPath', () => {
    it('should return null for undefined path', () => {
      expect(resolveAdminPath(undefined)).toBeNull();
    });

    it('should resolve admin:// prefix to /screenshots/', () => {
      const result = resolveAdminPath('admin://project-123.png');
      expect(result).toBe('/screenshots/project-123.png');
    });

    it('should handle different file extensions', () => {
      expect(resolveAdminPath('admin://image.jpg')).toBe('/screenshots/image.jpg');
      expect(resolveAdminPath('admin://photo.webp')).toBe('/screenshots/photo.webp');
      expect(resolveAdminPath('admin://pic.gif')).toBe('/screenshots/pic.gif');
    });

    it('should handle temp files', () => {
      const result = resolveAdminPath('admin://project-123.temp.png');
      expect(result).toBe('/screenshots/project-123.temp.png');
    });

    it('should return regular paths as-is', () => {
      expect(resolveAdminPath('images/photo.png')).toBe('images/photo.png');
      expect(resolveAdminPath('./images/photo.png')).toBe('./images/photo.png');
      expect(resolveAdminPath('../images/photo.png')).toBe('../images/photo.png');
    });

    it('should return absolute URLs as-is', () => {
      expect(resolveAdminPath('http://example.com/image.png')).toBe('http://example.com/image.png');
      expect(resolveAdminPath('https://example.com/image.png')).toBe('https://example.com/image.png');
    });

    it('should return domain-absolute paths as-is', () => {
      expect(resolveAdminPath('/images/photo.png')).toBe('/images/photo.png');
    });

    it('should return null for empty string', () => {
      expect(resolveAdminPath('')).toBeNull();
    });
  });
});
