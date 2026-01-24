import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SuspendReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
};

export function SuspendReasonDialog(props: SuspendReasonDialogProps) {
  const [reason, setReason] = useState("");

  const disabled = props.isLoading || reason.trim().length === 0;

  const onClose = (nextOpen: boolean) => {
    props.onOpenChange(nextOpen);
    if (!nextOpen) setReason("");
  };

  return (
    <Dialog open={props.open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description ? <DialogDescription>{props.description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Required…"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={props.isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await props.onConfirm(reason.trim());
              onClose(false);
            }}
            disabled={disabled}
          >
            {props.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description ? <DialogDescription>{props.description}</DialogDescription> : null}
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.isLoading}>
            Cancel
          </Button>
          <Button
            variant={props.confirmVariant ?? "default"}
            onClick={async () => {
              await props.onConfirm();
              props.onOpenChange(false);
            }}
            disabled={props.isLoading}
          >
            {props.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ResolveReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  isLoading?: boolean;
  onConfirm: (args: { action: string; notes?: string }) => Promise<void> | void;
};

export function ResolveReportDialog(props: ResolveReportDialogProps) {
  const [action, setAction] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = useMemo(() => action.trim().length > 0, [action]);

  const onClose = (nextOpen: boolean) => {
    props.onOpenChange(nextOpen);
    if (!nextOpen) {
      setAction("");
      setNotes("");
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description ? <DialogDescription>{props.description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolutionAction">Action</Label>
            <Input
              id="resolutionAction"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Required…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">Notes</Label>
            <Textarea
              id="resolutionNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={props.isLoading}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await props.onConfirm({
                action: action.trim(),
                notes: notes.trim() ? notes.trim() : undefined,
              });
              onClose(false);
            }}
            disabled={props.isLoading || !canSubmit}
          >
            Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
