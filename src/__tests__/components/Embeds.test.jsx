import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VideoEmbed, SlideDeckEmbed } from '../../components/Embeds';

describe('Embeds Components', () => {
  describe('VideoEmbed', () => {
    it('renders with a standard URL', () => {
      const url = 'https://example.com/video.mp4';
      render(<VideoEmbed url={url} />);
      const iframe = screen.getByTitle('Video Walkthrough');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', url);
    });

    it('converts Google Drive /view links to /preview', () => {
      const url = 'https://drive.google.com/file/d/12345/view?usp=sharing';
      const expectedUrl = 'https://drive.google.com/file/d/12345/preview';
      render(<VideoEmbed url={url} />);
      const iframe = screen.getByTitle('Video Walkthrough');
      expect(iframe).toHaveAttribute('src', expectedUrl);
    });

    it('converts Google Drive /edit links to /preview', () => {
      const url = 'https://drive.google.com/file/d/12345/edit?usp=sharing';
      const expectedUrl = 'https://drive.google.com/file/d/12345/preview';
      render(<VideoEmbed url={url} />);
      const iframe = screen.getByTitle('Video Walkthrough');
      expect(iframe).toHaveAttribute('src', expectedUrl);
    });

    it('uses a custom title if provided', () => {
      const url = 'https://example.com/video.mp4';
      const customTitle = 'My Custom Video';
      render(<VideoEmbed url={url} title={customTitle} />);
      const iframe = screen.getByTitle(customTitle);
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('SlideDeckEmbed', () => {
    it('renders with a standard URL', () => {
      const url = 'https://example.com/slides';
      render(<SlideDeckEmbed url={url} />);
      const iframe = screen.getByTitle('Reference Slide Deck');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', url);
    });

    it('converts Google Slides links to embed format', () => {
      const urlsToTest = [
        'https://docs.google.com/presentation/d/12345/edit#slide=id.p',
        'https://docs.google.com/presentation/d/12345/view?usp=sharing',
        'https://docs.google.com/presentation/d/12345/pub?start=false'
      ];
      const expectedUrl = 'https://docs.google.com/presentation/d/12345/embed?start=false&loop=false&delayms=3000';

      urlsToTest.forEach(url => {
        const { unmount } = render(<SlideDeckEmbed url={url} />);
        const iframe = screen.getByTitle('Reference Slide Deck');
        expect(iframe).toHaveAttribute('src', expectedUrl);
        unmount();
      });
    });

    it('uses a custom title if provided', () => {
      const url = 'https://example.com/slides';
      const customTitle = 'My Custom Slides';
      render(<SlideDeckEmbed url={url} title={customTitle} />);
      const iframe = screen.getByTitle(customTitle);
      expect(iframe).toBeInTheDocument();
    });
  });
});
