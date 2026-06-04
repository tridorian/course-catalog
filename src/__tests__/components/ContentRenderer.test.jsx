import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContentRenderer from '../../components/ContentRenderer';

describe('ContentRenderer', () => {
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
