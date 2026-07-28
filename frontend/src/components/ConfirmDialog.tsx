import * as Dialog from '@radix-ui/react-dialog';
import { Button, Heading } from './primitives';
import { Actions, Content, Overlay } from './ConfirmDialog.styles';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Radix-based confirm dialog for destructive admin actions (e.g. delete),
 *  replacing window.confirm so it matches the app's own styling/theme. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Overlay />
        <Content onOpenAutoFocus={(e) => e.preventDefault()}>
          <Dialog.Title asChild>
            <Heading as="h2" style={{ fontSize: '24px', margin: 0 }}>
              {title}
            </Heading>
          </Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <Actions>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </Actions>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
