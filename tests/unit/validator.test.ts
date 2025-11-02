import { Validator } from '../../src/generator/validator';
import { Project } from '../../src/types/project';
import { ProjectionError, ErrorCodes } from '../../src/utils/errors';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator(process.cwd());
  });

  const createValidProject = (overrides: Partial<Project> = {}): Project => ({
    id: 'test-project',
    title: 'Test Project',
    description: 'A test project',
    creationDate: '2024-01-15',
    tags: ['test'],
    pageLink: 'https://example.com',
    ...overrides
  });

  describe('Required field validation', () => {
    it('should pass validation for valid project with all required fields', () => {
      const projects = [createValidProject()];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should fail when id is missing', () => {
      const projects = [createValidProject({ id: '' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectionError);
        expect((error as ProjectionError).code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              message: expect.stringContaining('Missing required field')
            })
          ])
        );
      }
    });

    it('should fail when title is missing', () => {
      const projects = [createValidProject({ title: '' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('Missing required field')
            })
          ])
        );
      }
    });

    it('should fail when pageLink is missing', () => {
      const projects = [createValidProject({ pageLink: '' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'pageLink',
              message: expect.stringContaining('Missing required field')
            })
          ])
        );
      }
    });

    it('should fail when creationDate is missing', () => {
      const projects = [createValidProject({ creationDate: '' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'creationDate',
              message: expect.stringContaining('Missing required field')
            })
          ])
        );
      }
    });

    it('should fail when multiple required fields are missing', () => {
      const projects = [createValidProject({ id: '', title: '', pageLink: '' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        const errors = (error as ProjectionError).details.errors;
        expect(errors).toHaveLength(3);
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'id' }),
            expect.objectContaining({ field: 'title' }),
            expect.objectContaining({ field: 'pageLink' })
          ])
        );
      }
    });

    it('should pass when optional fields are missing', () => {
      const projects = [createValidProject({
        sourceLink: undefined,
        thumbnailLink: undefined,
        featured: undefined
      })];

      expect(() => validator.validate(projects)).not.toThrow();
    });
  });

  describe('Project ID slug format validation', () => {
    it('should pass for valid lowercase alphanumeric ID', () => {
      const projects = [createValidProject({ id: 'myproject' })];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should pass for valid ID with hyphens', () => {
      const projects = [createValidProject({ id: 'my-awesome-project' })];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should pass for valid ID with numbers', () => {
      const projects = [createValidProject({ id: 'project-123' })];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should fail for ID with uppercase letters', () => {
      const projects = [createValidProject({ id: 'MyProject' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              message: expect.stringContaining('Invalid project ID format')
            })
          ])
        );
      }
    });

    it('should fail for ID starting with hyphen', () => {
      const projects = [createValidProject({ id: '-myproject' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              message: expect.stringContaining('Invalid project ID format')
            })
          ])
        );
      }
    });

    it('should fail for ID ending with hyphen', () => {
      const projects = [createValidProject({ id: 'myproject-' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for ID with spaces', () => {
      const projects = [createValidProject({ id: 'my project' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for ID with special characters', () => {
      const projects = [createValidProject({ id: 'my_project' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for ID with consecutive hyphens', () => {
      const projects = [createValidProject({ id: 'my--project' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });
  });

  describe('Date format validation', () => {
    it('should pass for valid ISO date format', () => {
      const projects = [createValidProject({ creationDate: '2024-01-15' })];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should pass for valid date at year boundaries', () => {
      const projects = [
        createValidProject({ id: 'project-1', creationDate: '2024-01-01' }),
        createValidProject({ id: 'project-2', creationDate: '2024-12-31' })
      ];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should fail for invalid date format without hyphens', () => {
      const projects = [createValidProject({ creationDate: '20240115' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'creationDate',
              message: expect.stringContaining('Invalid date format')
            })
          ])
        );
      }
    });

    it('should fail for invalid date format with slashes', () => {
      const projects = [createValidProject({ creationDate: '2024/01/15' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for invalid date format MM-DD-YYYY', () => {
      const projects = [createValidProject({ creationDate: '01-15-2024' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for invalid date that does not exist', () => {
      const projects = [createValidProject({ creationDate: '2024-02-30' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'creationDate',
              message: expect.stringContaining('Invalid date')
            })
          ])
        );
      }
    });

    it('should fail for invalid month', () => {
      const projects = [createValidProject({ creationDate: '2024-13-01' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for invalid day', () => {
      const projects = [createValidProject({ creationDate: '2024-01-32' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });

    it('should fail for incomplete date', () => {
      const projects = [createValidProject({ creationDate: '2024-01' })];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
    });
  });

  describe('Duplicate ID detection', () => {
    it('should pass when all project IDs are unique', () => {
      const projects = [
        createValidProject({ id: 'project-1' }),
        createValidProject({ id: 'project-2' }),
        createValidProject({ id: 'project-3' })
      ];

      expect(() => validator.validate(projects)).not.toThrow();
    });

    it('should fail when duplicate IDs exist', () => {
      const projects = [
        createValidProject({ id: 'duplicate-id' }),
        createValidProject({ id: 'unique-id' }),
        createValidProject({ id: 'duplicate-id' })
      ];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              projectId: 'duplicate-id',
              message: expect.stringContaining('Duplicate project ID')
            })
          ])
        );
      }
    });

    it('should detect multiple sets of duplicates', () => {
      const projects = [
        createValidProject({ id: 'dup-1' }),
        createValidProject({ id: 'dup-1' }),
        createValidProject({ id: 'dup-2' }),
        createValidProject({ id: 'dup-2' })
      ];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        const errors = (error as ProjectionError).details.errors;
        const duplicateErrors = errors.filter((e: any) => e.message.includes('Duplicate'));
        expect(duplicateErrors).toHaveLength(2);
      }
    });

    it('should report correct project index for duplicate', () => {
      const projects = [
        createValidProject({ id: 'first' }),
        createValidProject({ id: 'second' }),
        createValidProject({ id: 'first' })
      ];

      try {
        validator.validate(projects);
      } catch (error) {
        const duplicateError = (error as ProjectionError).details.errors.find(
          (e: any) => e.message.includes('Duplicate')
        );
        expect(duplicateError.projectIndex).toBe(2);
      }
    });
  });

  describe('Edge cases', () => {
    it('should fail for empty projects array', () => {
      const projects: Project[] = [];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('cannot be empty')
            })
          ])
        );
      }
    });

    it('should fail for non-array input', () => {
      const projects = {} as any;

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        expect((error as ProjectionError).details.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('must be an array')
            })
          ])
        );
      }
    });

    it('should handle multiple validation errors for single project', () => {
      const projects = [
        createValidProject({
          id: 'Invalid_ID',
          title: '',
          creationDate: 'invalid-date'
        })
      ];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        const errors = (error as ProjectionError).details.errors;
        expect(errors.length).toBeGreaterThanOrEqual(3);
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'id' }),
            expect.objectContaining({ field: 'title' }),
            expect.objectContaining({ field: 'creationDate' })
          ])
        );
      }
    });

    it('should validate multiple projects and report all errors', () => {
      const projects = [
        createValidProject({ id: 'Invalid_ID_1', title: '' }),
        createValidProject({ id: 'valid-id' }),
        createValidProject({ id: 'Invalid_ID_2', creationDate: 'bad-date' })
      ];

      expect(() => validator.validate(projects)).toThrow(ProjectionError);
      
      try {
        validator.validate(projects);
      } catch (error) {
        const errors = (error as ProjectionError).details.errors;
        expect(errors.length).toBeGreaterThanOrEqual(4);
        
        // Check that errors reference correct project indices
        const project0Errors = errors.filter((e: any) => e.projectIndex === 0);
        const project2Errors = errors.filter((e: any) => e.projectIndex === 2);
        
        expect(project0Errors.length).toBeGreaterThan(0);
        expect(project2Errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateProjects method', () => {
    it('should return valid result for valid projects', () => {
      const projects = [createValidProject()];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result with errors for invalid projects', () => {
      const projects = [createValidProject({ id: '' })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include projectIndex in all errors', () => {
      const projects = [
        createValidProject({ id: '' }),
        createValidProject({ title: '' })
      ];

      const result = validator.validateProjects(projects);

      result.errors.forEach(error => {
        expect(error).toHaveProperty('projectIndex');
        expect(typeof error.projectIndex).toBe('number');
      });
    });
  });

  describe('Local asset file warnings', () => {
    it('should not warn for absolute HTTP URLs', () => {
      const projects = [createValidProject({
        thumbnailLink: 'http://example.com/image.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should not warn for absolute HTTPS URLs', () => {
      const projects = [createValidProject({
        thumbnailLink: 'https://example.com/image.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should not warn for domain-absolute paths', () => {
      const projects = [createValidProject({
        thumbnailLink: '/images/project.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for missing local file with ./ prefix', () => {
      const projects = [createValidProject({
        thumbnailLink: './non-existent-image.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('thumbnailLink');
      expect(result.warnings[0].message).toContain('Local file not found');
      expect(result.warnings[0].message).toContain('./non-existent-image.png');
    });

    it('should warn for missing local file with ../ prefix', () => {
      const projects = [createValidProject({
        thumbnailLink: '../non-existent-image.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('thumbnailLink');
      expect(result.warnings[0].message).toContain('Local file not found');
    });

    it('should warn for missing local file without prefix', () => {
      const projects = [createValidProject({
        thumbnailLink: 'images/non-existent.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('thumbnailLink');
    });

    it('should not warn when thumbnailLink is not provided', () => {
      const projects = [createValidProject()];

      const result = validator.validateProjects(projects);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should include projectId in warnings', () => {
      const projects = [createValidProject({
        id: 'my-project',
        thumbnailLink: './missing.png'
      })];

      const result = validator.validateProjects(projects);

      expect(result.warnings[0].projectId).toBe('my-project');
      expect(result.warnings[0].projectIndex).toBe(0);
    });
  });
});
