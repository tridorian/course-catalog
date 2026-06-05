import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ModuleRenderer from '../../components/ModuleRenderer';

describe('ModuleRenderer', () => {
  it('renders a lab module correctly', () => {
    const moduleData = {
      type: 'lab',
      title: 'Lab Module',
      blocks: [{ type: 'h1', content: 'Lab Content' }]
    };
    render(<ModuleRenderer module={moduleData} />);
    expect(screen.getByText('Lab Content')).toBeInTheDocument();
  });

  it('renders a presentation module correctly', () => {
    const moduleData = {
      type: 'presentation',
      title: 'Presentation Module',
      url: 'https://docs.google.com/presentation/d/123/edit',
      notes: 'Presentation notes'
    };
    render(<ModuleRenderer module={moduleData} />);
    expect(screen.getByTitle('Presentation Module')).toBeInTheDocument();
    expect(screen.getByText('Presentation notes')).toBeInTheDocument();
  });

  it('renders a resource module correctly', () => {
    const moduleData = {
      type: 'resource',
      title: 'Resource Module',
      url: 'https://docs.google.com/document/d/123/edit',
      description: 'Resource description'
    };
    render(<ModuleRenderer module={moduleData} />);
    expect(screen.getByText('Resource description')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(`open external resource: ${moduleData.title}`, 'i') })).toHaveAttribute('href', moduleData.url);
  });

  it('integrates the quiz parser and renders an interactive quiz when lab has check your understanding', () => {
    const moduleData = {
      type: 'lab',
      title: 'Lab with Quiz',
      blocks: [
        { type: 'h2', content: 'Check your understanding' },
        { type: 'p', content: 'Question 1: What is 2+2?' },
        { type: 'list', items: ['A) 3', 'B) 4', 'C) 5'] },
        { type: 'p', content: 'Correct Answer: B' }
      ]
    };
    const mockOnQuizPassed = vi.fn();
    render(<ModuleRenderer module={moduleData} onQuizPassed={mockOnQuizPassed} />);
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
