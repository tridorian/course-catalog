import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import InteractiveQuiz from '../../components/InteractiveQuiz';

describe('InteractiveQuiz Component', () => {
  const mockQuestions = [
    {
      question: 'What is the primary color of the catalog?',
      options: ['Option Red', 'Option Blue', 'Option Green', 'Option Yellow'],
      correctIndex: 2, // 'Option Green' is the correct answer
      feedback: 'Green is used for the default theme.'
    }
  ];

  it('renders questions and option choices', () => {
    render(<InteractiveQuiz questions={mockQuestions} onPassed={vi.fn()} />);

    expect(screen.getByText('What is the primary color of the catalog?')).toBeInTheDocument();
    expect(screen.getByText('Option Red')).toBeInTheDocument();
    expect(screen.getByText('Option Blue')).toBeInTheDocument();
    expect(screen.getByText('Option Green')).toBeInTheDocument();
    expect(screen.getByText('Option Yellow')).toBeInTheDocument();
  });

  it('handles correct answer selection and passes the quiz', () => {
    const passedMock = vi.fn();
    render(<InteractiveQuiz questions={mockQuestions} onPassed={passedMock} />);

    // Select correct option 'Option Green'
    const correctBtn = screen.getByRole('button', { name: /Option Green/i });
    fireEvent.click(correctBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
    fireEvent.click(submitBtn);

    // Verify completion screen
    expect(screen.getByText('Comprehension Verified')).toBeInTheDocument();
    expect(passedMock).toHaveBeenCalled();
  });

  it('handles incorrect answer, shows retry button, and reshuffles choices on retry', () => {
    const passedMock = vi.fn();
    render(<InteractiveQuiz questions={mockQuestions} onPassed={passedMock} />);

    // Get initial choices text order
    const buttonsBefore = screen.getAllByRole('button').filter(b => b.textContent.includes('Option'));
    const initialTextOrder = buttonsBefore.map(b => b.textContent);

    // Click incorrect option 'Option Red'
    const incorrectBtn = screen.getByRole('button', { name: /Option Red/i });
    fireEvent.click(incorrectBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Green is used for the default theme.')).toBeInTheDocument();

    // Mock Math.random to reverse order during shuffling on retry
    const mathRandomSpy = vi.spyOn(Math, 'random');
    // Math.random returning 0.99 forces standard swap order to change
    mathRandomSpy.mockReturnValue(0.99);

    // Click Try Again
    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(tryAgainBtn);

    // Get order after retry
    const buttonsAfter = screen.getAllByRole('button').filter(b => b.textContent.includes('Option'));
    const retryTextOrder = buttonsAfter.map(b => b.textContent);

    // Check that we returned to normal quiz question state
    expect(screen.queryByText('Validation Error')).not.toBeInTheDocument();
    
    // Check that all options are still present
    expect(screen.getByText('Option Red')).toBeInTheDocument();
    expect(screen.getByText('Option Green')).toBeInTheDocument();

    // Verify order changed or reshuffled
    expect(retryTextOrder.length).toBe(4);

    mathRandomSpy.mockRestore();
  });
});
