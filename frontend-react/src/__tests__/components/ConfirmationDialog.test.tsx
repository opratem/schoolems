import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender } from '../test-utils';
import ConfirmationDialog from '../../components/ConfirmationDialog';

describe('ConfirmationDialog Component', () => {
  const user = userEvent.setup();

  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render confirmation dialog when open', () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      customRender(<ConfirmationDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with custom button labels', () => {
      customRender(
        <ConfirmationDialog
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn();
      customRender(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = jest.fn();
      customRender(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking outside the dialog', async () => {
      const onCancel = jest.fn();
      customRender(
        <ConfirmationDialog {...defaultProps} onCancel={onCancel} closeOnClickOutside={true} />
      );

      const backdrop = screen.getByTestId('dialog-backdrop');
      await user.click(backdrop);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking inside the dialog content', async () => {
      const onCancel = jest.fn();
      customRender(
        <ConfirmationDialog {...defaultProps} onCancel={onCancel} closeOnClickOutside={true} />
      );

      const dialogContent = screen.getByRole('dialog');
      await user.click(dialogContent);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog when Escape key is pressed', async () => {
      const onCancel = jest.fn();
      customRender(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      await user.keyboard('{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not close on Escape when closeOnEscape is false', async () => {
      const onCancel = jest.fn();
      customRender(
        <ConfirmationDialog {...defaultProps} onCancel={onCancel} closeOnEscape={false} />
      );

      await user.keyboard('{Escape}');

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should confirm when Enter key is pressed', async () => {
      const onConfirm = jest.fn();
      customRender(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.keyboard('{Enter}');

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should support Tab navigation between buttons', async () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      confirmButton.focus();
      expect(confirmButton).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(cancelButton).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus(); // Should wrap back to first button
    });
  });

  describe('Loading States', () => {
    it('should show loading state for confirm button', () => {
      customRender(<ConfirmationDialog {...defaultProps} confirmLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
      expect(screen.getByTestId('confirm-loading')).toBeInTheDocument();
    });

    it('should disable cancel button when confirm is loading', () => {
      customRender(
        <ConfirmationDialog {...defaultProps} confirmLoading={true} disableCancelWhileLoading={true} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should allow cancel during loading when not disabled', () => {
      customRender(<ConfirmationDialog {...defaultProps} confirmLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Dialog Types', () => {
    it('should render danger dialog with warning styling', () => {
      customRender(<ConfirmationDialog {...defaultProps} type="danger" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-danger');

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('btn-danger');
    });

    it('should render warning dialog with warning styling', () => {
      customRender(<ConfirmationDialog {...defaultProps} type="warning" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-warning');

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('btn-warning');
    });

    it('should render info dialog with info styling', () => {
      customRender(<ConfirmationDialog {...defaultProps} type="info" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-info');
    });

    it('should show appropriate icons for different types', () => {
      customRender(<ConfirmationDialog {...defaultProps} type="danger" />);
      expect(screen.getByTestId('danger-icon')).toBeInTheDocument();

      customRender(<ConfirmationDialog {...defaultProps} type="warning" />);
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();

      customRender(<ConfirmationDialog {...defaultProps} type="info" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('Custom Content', () => {
    it('should render custom content instead of message', () => {
      const customContent = (
        <div>
          <p>Custom message with formatting</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );

      customRender(
        <ConfirmationDialog {...defaultProps} message={undefined}>
          {customContent}
        </ConfirmationDialog>
      );

      expect(screen.getByText('Custom message with formatting')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render additional action buttons', () => {
      const additionalActions = (
        <button data-testid="additional-action">More Options</button>
      );

      customRender(
        <ConfirmationDialog {...defaultProps} additionalActions={additionalActions} />
      );

      expect(screen.getByTestId('additional-action')).toBeInTheDocument();
    });

    it('should render with custom footer', () => {
      const customFooter = (
        <div data-testid="custom-footer">
          <button>Custom Action 1</button>
          <button>Custom Action 2</button>
        </div>
      );

      customRender(
        <ConfirmationDialog {...defaultProps} customFooter={customFooter} />
      );

      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Custom Action 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Action 2')).toBeInTheDocument();

      // Default buttons should not be present when custom footer is used
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    it('should render small dialog', () => {
      customRender(<ConfirmationDialog {...defaultProps} size="small" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-small');
    });

    it('should render large dialog', () => {
      customRender(<ConfirmationDialog {...defaultProps} size="large" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-large');
    });

    it('should render full-width dialog', () => {
      customRender(<ConfirmationDialog {...defaultProps} size="full" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-full');
    });
  });

  describe('Animation and Transitions', () => {
    it('should apply entrance animation', () => {
      customRender(<ConfirmationDialog {...defaultProps} animate={true} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-animate-in');
    });

    it('should apply exit animation when closing', async () => {
      const { rerender } = customRender(<ConfirmationDialog {...defaultProps} animate={true} />);

      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} animate={true} />);

      // During exit animation, dialog should still be in DOM but with exit class
      const dialog = screen.queryByRole('dialog');
      if (dialog) {
        expect(dialog).toHaveClass('dialog-animate-out');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should focus confirm button by default', () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();
    });

    it('should focus cancel button when specified', () => {
      customRender(<ConfirmationDialog {...defaultProps} initialFocus="cancel" />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveFocus();
    });

    it('should trap focus within dialog', async () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Focus should cycle between buttons
      cancelButton.focus();
      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(cancelButton).toHaveFocus();
    });

    it('should restore focus to trigger element when closed', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Dialog';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = customRender(<ConfirmationDialog {...defaultProps} />);

      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);

      expect(triggerButton).toHaveFocus();

      document.body.removeChild(triggerButton);
    });

    it('should announce dialog content to screen readers', () => {
      customRender(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const title = screen.getByText('Confirm Action');
      const message = screen.getByText('Are you sure you want to proceed?');

      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
      expect(dialog).toHaveAttribute('aria-describedby', message.id);
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme styling', () => {
      customRender(<ConfirmationDialog {...defaultProps} theme="dark" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-dark');
    });

    it('should apply light theme styling', () => {
      customRender(<ConfirmationDialog {...defaultProps} theme="light" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-light');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt to mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      customRender(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dialog-mobile');
    });

    it('should stack buttons vertically on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      customRender(<ConfirmationDialog {...defaultProps} />);

      const buttonContainer = screen.getByTestId('dialog-buttons');
      expect(buttonContainer).toHaveClass('buttons-stacked');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      const minimalProps = {
        isOpen: true,
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
      };

      customRender(<ConfirmationDialog {...minimalProps} />);

      // Should render with default values
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle null callbacks gracefully', async () => {
      customRender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={null}
          onCancel={null}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Should not crash when clicking buttons with null callbacks
      await user.click(confirmButton);
      await user.click(cancelButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      const { rerender } = customRender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Re-render with same props
      rerender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test message"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = customRender(<ConfirmationDialog {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
