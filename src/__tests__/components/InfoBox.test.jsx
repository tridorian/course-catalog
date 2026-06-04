import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import InfoBox from '../../components/InfoBox';

describe('InfoBox', () => {
  it('renders with default title', () => {
    render(<InfoBox>Test Content</InfoBox>);
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<InfoBox title="Custom Title">Test Content</InfoBox>);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the Info icon', () => {
    const { container } = render(<InfoBox>Test Content</InfoBox>);
    // Checking for lucide-react Info icon svg element
    const svgEl = container.querySelector('svg');
    expect(svgEl).toBeInTheDocument();
    expect(svgEl).toHaveClass('lucide-info');
  });
});
