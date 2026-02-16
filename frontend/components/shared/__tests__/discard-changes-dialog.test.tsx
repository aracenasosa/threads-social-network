import { render, screen } from '@/__tests__/test-utils';
import { DiscardChangesDialog } from '../discard-changes-dialog';
import userEvent from '@testing-library/user-event';

describe('DiscardChangesDialog Component', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(<DiscardChangesDialog {...defaultProps} />);
    expect(screen.getByText('Discard changes?')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<DiscardChangesDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  it('should display default title and description', () => {
    render(<DiscardChangesDialog {...defaultProps} />);
    expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    expect(
      screen.getByText(
        /You have unsaved changes. Are you sure you want to discard them/i,
      ),
    ).toBeInTheDocument();
  });

  it('should display custom title and description', () => {
    render(
      <DiscardChangesDialog
        {...defaultProps}
        title="Custom Title"
        description="Custom description text"
      />,
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should display default button labels', () => {
    render(<DiscardChangesDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('should display custom button labels', () => {
    render(
      <DiscardChangesDialog
        {...defaultProps}
        cancelLabel="Keep Editing"
        discardLabel="Delete Changes"
      />,
    );
    expect(
      screen.getByRole('button', { name: /keep editing/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete changes/i }),
    ).toBeInTheDocument();
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<DiscardChangesDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('should call both onConfirm and onOpenChange when discard button is clicked', async () => {
    const user = userEvent.setup();
    render(<DiscardChangesDialog {...defaultProps} />);

    const discardButton = screen.getByRole('button', { name: /discard/i });
    await user.click(discardButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should have proper accessibility attributes', () => {
    render(<DiscardChangesDialog {...defaultProps} />);
    
    const title = screen.getByText('Discard changes?');
    const description = screen.getByText(
      /You have unsaved changes. Are you sure you want to discard them/i,
    );

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  it('should render buttons with correct styling classes', () => {
    render(<DiscardChangesDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const discardButton = screen.getByRole('button', { name: /discard/i });

    expect(cancelButton).toHaveClass('cursor-pointer');
    expect(discardButton).toHaveClass('cursor-pointer');
  });
});
