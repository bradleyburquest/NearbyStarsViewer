import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

function BrokenViewer(): never {
  throw new Error('Synthetic viewer failure');
}

describe('ErrorBoundary', () => {
  it('keeps a viewer failure contained to the scene region', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary scope="viewer">
        <BrokenViewer />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('3D viewer unavailable');
    expect(screen.getByRole('button', { name: 'Retry viewer' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
