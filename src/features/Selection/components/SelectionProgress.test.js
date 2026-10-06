/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SelectionProgress from './SelectionProgress';
import { normalizeGallery } from '../../../utils/selectionGalleryUtils';

describe('SelectionProgress', () => {
  test('renders 72/80 and 90%', () => {
    const gallery = normalizeGallery({ status: 'active', selectionMode: 'limit', selectionLimit: 80, selectedCount: 72 });
    render(<SelectionProgress gallery={gallery} />);
    expect(screen.getByTestId('selection-progress')).toHaveTextContent('72 / 80');
    expect(screen.getByTestId('selection-progress')).toHaveTextContent('90%');
  });

  test('limit reached messaging at 80/80', () => {
    const gallery = normalizeGallery({ status: 'active', selectionMode: 'limit', selectionLimit: 80, selectedCount: 80 });
    render(<SelectionProgress gallery={gallery} />);
    expect(screen.getByText(/Selection limit reached/i)).toBeInTheDocument();
  });

  test('remaining messaging when approaching limit', () => {
    const gallery = normalizeGallery({ status: 'active', selectionMode: 'limit', selectionLimit: 80, selectedCount: 75 });
    render(<SelectionProgress gallery={gallery} />);
    expect(screen.getByText(/5 selections remaining/i)).toBeInTheDocument();
  });

  test('unlimited mode shows count without limit', () => {
    const gallery = normalizeGallery({ status: 'active', selectionMode: 'unlimited', selectionLimit: null, selectedCount: 24 });
    render(<SelectionProgress gallery={gallery} />);
    expect(screen.getByTestId('selection-progress')).toHaveTextContent('24');
  });
});
