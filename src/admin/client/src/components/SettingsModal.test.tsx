import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SettingsModal } from './SettingsModal';
import type { Config } from '../../../../types';

const mockConfig: Config = {
  title: 'Test Site',
  description: 'Test Description',
  baseUrl: './',
  dynamicBackgrounds: [],
};

describe('SettingsModal', () => {
  it('should render when open', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        config={mockConfig}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Backgrounds')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    const { container } = render(
      <SettingsModal
        isOpen={false}
        onClose={onClose}
        config={mockConfig}
        onSave={onSave}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        config={mockConfig}
        onSave={onSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should switch tabs', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        config={mockConfig}
        onSave={onSave}
      />
    );

    const advancedTab = screen.getByText('Advanced');
    fireEvent.click(advancedTab);

    expect(screen.getByText('Output Directory')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        config={mockConfig}
        onSave={onSave}
      />
    );

    // Make a change to enable save button
    const titleInput = screen.getByLabelText(/Site Title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
