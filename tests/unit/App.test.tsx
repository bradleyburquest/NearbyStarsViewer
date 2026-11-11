import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../../src/app/App';

vi.mock('../../src/scene/SceneViewport', () => ({
  SceneViewport: () => <section aria-label="3D viewport test double" />,
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('renders Phase 7 scientific details and filters planet hosts', () => {
    render(<App />);
    expect(screen.getByText('Phase 8 · Production hardened')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('dialog', { name: 'Viewer help' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    fireEvent.click(screen.getByLabelText('Confirmed planet hosts only'));
    expect(screen.getByText('37 of 150 systems shown')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Earth' }));
    expect(
      screen.getByRole('heading', { name: 'Earth-centered neighborhood' }),
    ).toBeInTheDocument();
    expect(screen.getByText('37 of 150 systems shown')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alpha Centauri/ }));
    expect(screen.getByRole('heading', { name: 'Alpha Centauri' })).toBeInTheDocument();
    expect(screen.getByText(/HIP 71683/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exoplanets · 2' })).toBeInTheDocument();
    expect(screen.getByText('Proxima Cen b')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Barnard' } });
    expect(screen.getByText('1 of 150 systems shown')).toBeInTheDocument();
  });
});
