import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import WarningBox from '../../components/WarningBox';

describe('WarningBox', () => {
  it('renders children with default title', () => {
    render(<WarningBox>Test content</WarningBox>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders with a custom title', () => {
    render(<WarningBox title="Custom Alert">More content</WarningBox>);
    expect(screen.getByText('More content')).toBeInTheDocument();
    expect(screen.getByText('Custom Alert')).toBeInTheDocument();
    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  it('renders the ShieldAlert icon', () => {
    const { container } = render(<WarningBox>Content</WarningBox>);
    // ShieldAlert from lucide-react renders an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('lucide-shield-alert');
  });
});
