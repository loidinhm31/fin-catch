import React, { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { createPortfolio, updatePortfolio } from "@fin-catch/ui/services";
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
  editingPortfolio?: Portfolio | null;
}

export const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPortfolio,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingPortfolio;

  // Initialize form when editing
  useEffect(() => {
    if (isOpen && editingPortfolio) {
      setName(editingPortfolio.name);
      setDescription(editingPortfolio.description || "");
    } else if (isOpen && !editingPortfolio) {
      setName("");
      setDescription("");
    }
  }, [isOpen, editingPortfolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Portfolio name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      let resultPortfolio: Portfolio;

      if (isEditMode && editingPortfolio) {
        // Update existing portfolio
        const updatedPortfolio: Portfolio = {
          ...editingPortfolio,
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await updatePortfolio(updatedPortfolio);
        resultPortfolio = updatedPortfolio;
      } else {
        // Create new portfolio
        const portfolioId = await createPortfolio({
          id: "", // Backend will generate UUID
          name: name.trim(),
          description: description.trim() || undefined,
          createdAt: Math.floor(Date.now() / 1000),
          syncVersion: 1,
        });
        resultPortfolio = {
          id: portfolioId,
          name: name.trim(),
          description: description.trim() || undefined,
          createdAt: Math.floor(Date.now() / 1000),
          syncVersion: 1,
        };
      }

      // Reset form
      setName("");
      setDescription("");
      setError(null);

      onSuccess(resultPortfolio);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update portfolio"
            : "Failed to create portfolio",
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Portfolio" : "Create Portfolio"}
    >
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
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Portfolio"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
