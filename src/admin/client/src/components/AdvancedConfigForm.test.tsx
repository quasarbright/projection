import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AdvancedConfigForm } from './AdvancedConfigForm';
import type { Config } from '../../../../types';

const mockConfig: Config = {
  title: 'Test Site',
  description: 'Test Description',
  baseUrl: './',
  customStyles: 'custom/styles',
  customScripts: 'custom/scripts',
  output: 'dist',
};

describe('AdvancedConfigForm', () => {
  it('should render all form fields', () => {
    const onChange = vi.fn();

    render(
      <AdvancedConfigForm
        config={mockConfig}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/Custom Styles Path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Custom Scripts Path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Output Directory/i)).toBeInTheDocument();
  });

  it('should call onChange when custom styles is changed', () => {
    const onChange = vi.fn();

    render(
      <AdvancedConfigForm
        config={mockConfig}
        onChange={onChange}
      />
    );

    const stylesInput = screen.getByLabelText(/Custom Styles Path/i);
    fireEvent.change(stylesInput, { target: { value: 'new/styles' } });

    expect(onChange).toHaveBeenCalledWith({ customStyles: 'new/styles' });
  });

  it('should display info box', () => {
    const onChange = vi.fn();

    render(
      <AdvancedConfigForm
        config={mockConfig}
        onChange={onChange}
      />
    );

    expect(screen.getByText(/These settings are for advanced users/i)).toBeInTheDocument();
  });
});
