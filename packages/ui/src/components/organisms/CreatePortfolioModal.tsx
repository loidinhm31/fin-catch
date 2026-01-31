import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { finCatchAPI } from "@fin-catch/ui/services";
import { Portfolio } from "@fin-catch/shared";
import {
  Button,
  ErrorAlert,
  Input,
  Label,
  Modal,
  Textarea,
} from "@fin-catch/ui/components/atoms";

export interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (portfolio: Portfolio) => void;
}

export const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Portfolio name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const portfolioId = await finCatchAPI.createPortfolio({
        id: "", // Backend will generate UUID
        name: name.trim(),
        description: description.trim() || undefined,
        created_at: Math.floor(Date.now() / 1000),
        sync_version: 1,
      });

      // Reset form
      setName("");
      setDescription("");
      setError(null);

      onSuccess({
        id: portfolioId,
        name: name.trim(),
        description: description.trim() || undefined,
        created_at: Math.floor(Date.now() / 1000),
        sync_version: 1,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create portfolio",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Portfolio">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          )}

          <div>
            <Label htmlFor="portfolio-name">
              <Wallet className="w-4 h-4 inline-block mr-2" />
              Portfolio Name
            </Label>
            <Input
              id="portfolio-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Long-term Investments"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="portfolio-description">
              Description (Optional)
            </Label>
            <Textarea
              id="portfolio-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this portfolio..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Portfolio"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
