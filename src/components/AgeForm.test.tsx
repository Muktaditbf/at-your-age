import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AgeForm } from './AgeForm.tsx';

describe('AgeForm', () => {
  it('only accepts digits and searches on Enter', async () => {
    const onSubmit = vi.fn();
    render(<AgeForm age={undefined} mode="roast" onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Your age' });
    await userEvent.type(input, '2a4x{Enter}');
    expect(input).toHaveValue('24');
    expect(onSubmit).toHaveBeenCalledWith(24);
  });

  it('explains what is wrong with an impossible age', async () => {
    const onSubmit = vi.fn();
    render(<AgeForm age={undefined} mode="roast" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Your age' }), '999');
    await userEvent.click(screen.getByRole('button', { name: 'Roast me' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Type an age from 1 to 120');
    expect(screen.getByRole('textbox', { name: 'Your age' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('steps with buttons and arrow keys', async () => {
    render(<AgeForm age={30} mode="hype" onSubmit={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Your age' });
    await userEvent.click(screen.getByRole('button', { name: 'One year older' }));
    expect(input).toHaveValue('31');
    await userEvent.type(input, '{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('29');
    expect(screen.getByRole('button', { name: 'Hype me' })).toBeInTheDocument();
  });

  it('searches straight away from a quick pick', async () => {
    const onSubmit = vi.fn();
    render(<AgeForm age={undefined} mode="roast" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: '40' }));
    expect(onSubmit).toHaveBeenCalledWith(40);
  });
});
