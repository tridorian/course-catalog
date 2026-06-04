import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContentRenderer from '../../components/ContentRenderer';

// Mock child components to isolate ContentRenderer
vi.mock('../../components/Embeds', () => ({
  VideoEmbed: ({ url, title }) => <div data-testid="video-embed">{title} - {url}</div>,
  SlideDeckEmbed: ({ url, title }) => <div data-testid="slide-embed">{title} - {url}</div>
}));
vi.mock('../../components/CodeBlock', () => ({
  default: ({ code, language }) => <div data-testid="code-block" data-language={language}>{code}</div>
}));
vi.mock('../../components/WarningBox', () => ({
  default: ({ title, children }) => <div data-testid="warning-box"><h3>{title}</h3><div>{children}</div></div>
}));
vi.mock('../../components/InfoBox', () => ({
  default: ({ title, children }) => <div data-testid="info-box"><h3>{title}</h3><div>{children}</div></div>
}));

describe('ContentRenderer', () => {
  it('renders nothing when no blocks are provided', () => {
    const { container } = render(<ContentRenderer />);
    expect(container.firstChild).toBeNull();
  });

  // Basic Blocks
  describe('Basic text blocks', () => {
    it('renders h1 block', () => {
      const blocks = [{ type: 'h1', content: 'Heading 1' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 1').tagName).toBe('H1');
    });

    it('renders h2 block', () => {
      const blocks = [{ type: 'h2', content: 'Heading 2' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
      expect(screen.getByText('Heading 2').tagName).toBe('H2');
    });

    it('renders h3 block', () => {
      const blocks = [{ type: 'h3', content: 'Heading 3' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Heading 3')).toBeInTheDocument();
      expect(screen.getByText('Heading 3').tagName).toBe('H3');
    });

    it('renders paragraph with markdown (bold, code, links)', () => {
      const blocks = [{
        type: 'p',
        content: 'This has **bold text**, `inline code`, and a [link](https://example.com).'
      }];
      render(<ContentRenderer blocks={blocks} />);

      expect(screen.getByText('bold text')).toBeInTheDocument();
      expect(screen.getByText('bold text').tagName).toBe('STRONG');

      expect(screen.getByText('inline code')).toBeInTheDocument();
      expect(screen.getByText('inline code').tagName).toBe('CODE');

      const link = screen.getByText('link');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders italic paragraph when specified', () => {
      const blocks = [{ type: 'p', content: 'Italic text', italic: true }];
      render(<ContentRenderer blocks={blocks} />);
      const p = screen.getByText('Italic text');
      expect(p.tagName).toBe('P');
      expect(p).toHaveClass('italic');
    });
  });

  // Embeds & Simple Components
  describe('Embeds and Simple Components', () => {
    it('renders video embed', () => {
      const blocks = [{ type: 'video', url: 'video.mp4', title: 'Test Video' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByTestId('video-embed')).toHaveTextContent('Test Video - video.mp4');
    });

    it('renders slides embed', () => {
      const blocks = [{ type: 'slides', url: 'slides.pdf', title: 'Test Slides' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByTestId('slide-embed')).toHaveTextContent('Test Slides - slides.pdf');
    });

    it('renders code block', () => {
      const blocks = [{ type: 'code', language: 'javascript', code: 'const x = 1;' }];
      render(<ContentRenderer blocks={blocks} />);
      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveTextContent('const x = 1;');
      expect(codeBlock).toHaveAttribute('data-language', 'javascript');
    });

    it('renders info box', () => {
      const blocks = [{ type: 'info', title: 'Note', content: 'This is an info box.' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByTestId('info-box')).toBeInTheDocument();
      expect(screen.getByText('Note')).toBeInTheDocument();
      expect(screen.getByText('This is an info box.')).toBeInTheDocument();
    });

    it('renders warning box', () => {
      const blocks = [{ type: 'warning', title: 'Danger', content: 'Watch out!' }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByTestId('warning-box')).toBeInTheDocument();
      expect(screen.getByText('Danger')).toBeInTheDocument();
      expect(screen.getByText('Watch out!')).toBeInTheDocument();
    });
  });

  // Complex Layouts
  describe('Complex layout blocks', () => {
    it('renders grid block with items', () => {
      const blocks = [{
        type: 'grid',
        items: [
          { title: 'Item 1', content: 'Content 1', icon: 'Star' },
          { title: 'Item 2', content: 'Content 2', border: '#ff0000' }
        ]
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('renders bullet list', () => {
      const blocks = [{
        type: 'list',
        items: ['First item', 'Second **bold** item']
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('renders numbered list with simple strings and complex items', () => {
      const blocks = [{
        type: 'numbered_list',
        items: [
          'Simple item',
          { title: 'Complex Title', content: 'Complex Content', code: 'test code', prompt: 'test prompt' }
        ]
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Simple item')).toBeInTheDocument();
      expect(screen.getByText('Complex Title')).toBeInTheDocument();
      expect(screen.getByText('Complex Content')).toBeInTheDocument();
      expect(screen.getByTestId('code-block')).toHaveTextContent('test code');
      expect(screen.getByText(/Prompt: "test prompt"/)).toBeInTheDocument();
    });

    it('renders tier card', () => {
      const blocks = [{
        type: 'tier_card',
        title: 'Pro Tier',
        description: 'The best tier',
        recommended: true,
        code: 'npm install pro',
        items: ['Feature 1']
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
      expect(screen.getByText('Pro Tier')).toBeInTheDocument();
      expect(screen.getByText('The best tier')).toBeInTheDocument();
      expect(screen.getByTestId('code-block')).toHaveTextContent('npm install pro');
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
    });

    it('renders feature card', () => {
      const blocks = [{
        type: 'feature_card',
        title: 'Cool Feature',
        content: 'It does things',
        prompt: 'do things',
        footer: 'Version 2.0'
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Cool Feature')).toBeInTheDocument();
      expect(screen.getByText('It does things')).toBeInTheDocument();
      expect(screen.getByText(/Prompt: "do things"/)).toBeInTheDocument();
      expect(screen.getByText('Version 2.0')).toBeInTheDocument();
    });

    it('renders timeline', () => {
      const blocks = [{
        type: 'timeline',
        items: [
          { title: 'Step 1', content: 'Do this', code: 'step1()', prompt: 'run step 1' }
        ]
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Do this')).toBeInTheDocument();
      expect(screen.getByTestId('code-block')).toHaveTextContent('step1()');
      expect(screen.getByText(/"run step 1"/)).toBeInTheDocument();
    });

    it('renders recovery options', () => {
      const blocks = [{
        type: 'recovery_options',
        items: [
          { title: 'Option 1', content: 'Restore backup', highlight: true }
        ]
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('INSTANT RECOVERY')).toBeInTheDocument();
      expect(screen.getByText('Option 1:')).toBeInTheDocument();
      expect(screen.getByText('Restore backup')).toBeInTheDocument();
    });

    it('renders congrats block', () => {
      const blocks = [{
        type: 'congrats',
        content: 'You finished the course!'
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      expect(screen.getByText('You finished the course!')).toBeInTheDocument();
    });

    it('renders next steps block', () => {
      const blocks = [{
        type: 'next_steps',
        title: 'What to do next',
        items: [
          { title: 'Step A', content: 'Go here' }
        ]
      }];
      render(<ContentRenderer blocks={blocks} />);
      expect(screen.getByText('What to do next')).toBeInTheDocument();
      expect(screen.getByText('Step A:')).toBeInTheDocument();
      expect(screen.getByText('Go here')).toBeInTheDocument();
    });
  });

  // Link Security
  describe('Link security checks', () => {
    it('renders safe markdown links as anchor tags', () => {
      const blocks = [
        {
          type: 'p',
          content: 'Check out this [Safe Link](https://example.com) here.'
        }
      ];

      const { getByText } = render(<ContentRenderer blocks={blocks} />);
      const link = getByText('Safe Link');

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders relative markdown links as anchor tags', () => {
      const blocks = [
        {
          type: 'p',
          content: 'Go to [Relative Path](/about) now.'
        }
      ];

      const { getByText } = render(<ContentRenderer blocks={blocks} />);
      const link = getByText('Relative Path');

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/about');
    });

    it('neutralizes malicious javascript: links', () => {
      const blocks = [
        {
          type: 'p',
          content: 'Click this [Dangerous Link](javascript:alert(1)) please.'
        }
      ];

      const { getByText } = render(<ContentRenderer blocks={blocks} />);
      const linkText = getByText('Dangerous Link');

      expect(linkText.tagName).toBe('SPAN');
      expect(linkText).not.toHaveAttribute('href');
      expect(linkText).toHaveAttribute('title', 'Blocked insecure link');
    });

    it('neutralizes maliciously formatted javascript: links', () => {
      const blocks = [
        {
          type: 'p',
          content: 'Click this [Sneaky Link](  javascript:alert("XSS")  ) please.'
        }
      ];

      const { getByText } = render(<ContentRenderer blocks={blocks} />);
      const linkText = getByText('Sneaky Link');

      expect(linkText.tagName).toBe('SPAN');
      expect(linkText).not.toHaveAttribute('href');
    });
  });
});
