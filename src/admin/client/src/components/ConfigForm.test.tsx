import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfigForm } from './ConfigForm';
import type { Config } from '../../../../types';

const mockConfig: Config = {
  title: 'Test Site',
  description: 'Test Description',
  baseUrl: './',
};

describe('ConfigForm', () => {
  it('should render all form fields', () => {
    const onChange = vi.fn();
    const errors = {};

    render(
      <ConfigForm
        config={mockConfig}
        onChange={onChange}
        errors={errors}
      />
    );

    expect(screen.getByLabelText(/Site Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Site Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base URL/i)).toBeInTheDocument();
  });

  it('should call onChange when title is changed', () => {
    const onChange = vi.fn();
    const errors = {};

    render(
      <ConfigForm
        config={mockConfig}
        onChange={onChange}
        errors={errors}
      />
    );

    const titleInput = screen.getByLabelText(/Site Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(onChange).toHaveBeenCalledWith({ title: 'New Title' });
  });

  it('should display error messages', () => {
    const onChange = vi.fn();
    const errors = {
      title: 'Title is required',
      baseUrl: 'Invalid URL format',
    };

    render(
      <ConfigForm
        config={mockConfig}
        onChange={onChange}
        errors={errors}
      />
    );

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
  });
});
