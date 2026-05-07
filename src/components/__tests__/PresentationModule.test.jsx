import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import PresentationModule from '../PresentationModule';

// Mock the Embeds
vi.mock('../Embeds', () => ({
  VideoEmbed: ({ title }) => <div data-testid="video-embed">{title}</div>,
  SlideDeckEmbed: ({ title }) => <div data-testid="slides-embed">{title}</div>
}));

// Mock ContentRenderer
vi.mock('../ContentRenderer', () => ({
  default: () => <div data-testid="content-renderer">Content</div>
}));

describe('PresentationModule', () => {
  it('renders VideoEmbed when a video block is present', () => {
    const module = {
      type: 'presentation',
      blocks: [
        { type: 'video', url: 'https://drive.google.com/file/d/123/view', title: 'Test Video' },
        { type: 'p', content: 'Some notes' }
      ]
    };
    render(<PresentationModule module={module} />);
    expect(screen.getByTestId('video-embed')).toBeInTheDocument();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
  });

  it('renders SlideDeckEmbed when a slides block is present', () => {
    const module = {
      type: 'presentation',
      blocks: [
        { type: 'slides', url: 'https://docs.google.com/presentation/d/123/edit', title: 'Test Slides' }
      ]
    };
    render(<PresentationModule module={module} />);
    expect(screen.getByTestId('slides-embed')).toBeInTheDocument();
    expect(screen.getByText('Test Slides')).toBeInTheDocument();
  });
});
