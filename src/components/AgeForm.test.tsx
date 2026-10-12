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

  it('works the ruler like a slider and says when the age changed', async () => {
    const onSubmit = vi.fn();
    render(<AgeForm age={30} mode="hype" onSubmit={onSubmit} />);
    const ruler = screen.getByRole('slider', { name: 'Your age' });
    expect(ruler).toHaveAttribute('aria-valuenow', '30');
    ruler.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(ruler).toHaveAttribute('aria-valuenow', '31');
    expect(ruler).toHaveAttribute('aria-valuetext', '31 years old');
    expect(screen.getByRole('textbox', { name: 'Your age' })).toHaveValue('31');
    expect(screen.getByRole('button', { name: 'Hype me up at 31' })).toBeInTheDocument();
    await userEvent.keyboard('{PageUp}{End}');
    expect(ruler).toHaveAttribute('aria-valuenow', '120');
    await userEvent.keyboard('{Home}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith(1);
  });

  it('steps with the arrow keys in the headline too', async () => {
    render(<AgeForm age={undefined} mode="roast" onSubmit={vi.fn()} />);
    const input = screen.getByRole('textbox', { name: 'Your age' });
    await userEvent.type(input, '30{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(input).toHaveValue('31');
    expect(screen.getByRole('slider', { name: 'Your age' })).toHaveAttribute('aria-valuenow', '31');
  });
});
