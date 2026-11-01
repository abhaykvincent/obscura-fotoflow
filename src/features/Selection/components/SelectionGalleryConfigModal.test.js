/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionGalleryConfigModal from './SelectionGalleryConfigModal';

describe('SelectionGalleryConfigModal', () => {
  test('portals to document.body as a direct child (escapes transformed ancestors)', () => {
    // Simulate the ShareGallery nesting that caused the bug: a wrapper with
    // backdrop-filter + overflow, which traps position:fixed descendants.
    const trap = document.createElement('div');
    trap.setAttribute('data-testid', 'filter-trap');
    trap.style.setProperty('backdrop-filter', 'blur(8px)');
    trap.style.overflow = 'scroll';
    document.body.appendChild(trap);

    render(
      <div data-testid="nested-host">
        <SelectionGalleryConfigModal onSave={() => {}} onClose={() => {}} />
      </div>,
      { container: trap },
    );

    const dialog = screen.getByTestId('selection-gallery-config');
    // Must be a direct child of body — not inside the filtered ancestor —
    // otherwise `position: fixed` resolves against the trap and the dialog
    // renders off-screen while its backdrop still covers the viewport.
    // eslint-disable-next-line testing-library/no-node-access
    expect(dialog.parentElement).toBe(document.body);

    document.body.removeChild(trap);
  });

  test('Escape calls onClose', () => {
    const onClose = jest.fn();
    render(<SelectionGalleryConfigModal onSave={() => {}} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
