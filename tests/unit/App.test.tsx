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
    expect(screen.getByRole('heading', { name: 'NearbyStarsViewer' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('dialog', { name: 'Viewer help' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    fireEvent.click(screen.getByLabelText('Confirmed planet hosts only'));
    expect(screen.getByText('38 of 151 systems shown')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sun-centered neighborhood' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alpha Centauri/ }));
    expect(screen.getByRole('heading', { name: 'Alpha Centauri' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alpha Centauri on Wikipedia/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Alpha_Centauri',
    );
    expect(screen.getByText(/HIP 71683/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exoplanets · 2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Proxima Cen b on Wikipedia/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Proxima_Centauri_b',
    );
    expect(screen.getByText('Centaurus (Cen)')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Barnard' } });
    expect(screen.getByText('1 of 151 systems shown')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Sun' } });
    expect(screen.getByText('1 of 151 systems shown')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sun.*0.00 ly/ }));
    expect(screen.getByRole('heading', { name: 'Sun' })).toBeInTheDocument();
    expect(screen.getByText('-26.74 (visual V)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Planets · 8' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Earth on Wikipedia/ })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Earth',
    );
  });
});
