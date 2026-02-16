import { render, screen } from '@/__tests__/test-utils';
import { PostButton } from '../post-button';
import userEvent from '@testing-library/user-event';

describe('PostButton Component', () => {
  it('should render with default "Post" text', () => {
    render(<PostButton />);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    render(<PostButton>Submit</PostButton>);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<PostButton onClick={handleClick}>Click me</PostButton>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<PostButton disabled>Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toBeDisabled();
  });

  it('should not trigger click when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <PostButton disabled onClick={handleClick}>
        Post
      </PostButton>,
    );
    const button = screen.getByRole('button', { name: /post/i });

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should have cursor-pointer class', () => {
    render(<PostButton>Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toHaveClass('cursor-pointer');
  });

  it('should apply custom className', () => {
    render(<PostButton className="custom-class">Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should have ghost variant', () => {
    render(<PostButton>Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('should apply disabled styling when disabled', () => {
    render(<PostButton disabled>Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toHaveClass('cursor-not-allowed');
    expect(button).toHaveClass('opacity-50');
  });

  it('should accept all Button props', () => {
    render(<PostButton type="submit">Post</PostButton>);
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toHaveAttribute('type', 'submit');
  });
});
