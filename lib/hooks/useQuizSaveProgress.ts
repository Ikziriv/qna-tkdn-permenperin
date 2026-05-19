import { useState, useCallback } from 'react';
import { UserAnswer } from '@/types';

export interface UseQuizSaveProgressResult {
  isSaving: boolean;
  saveError: string | null;
  saveProgress: (answers: UserAnswer[]) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook to manage quiz progress saving with loading and error states.
 * The actual API call is delegated to the onSaveProgress callback prop.
 */
export function useQuizSaveProgress(
  onSaveProgress?: (answers: UserAnswer[]) => Promise<void>
): UseQuizSaveProgressResult {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveProgress = useCallback(
    async (answers: UserAnswer[]): Promise<boolean> => {
      if (!onSaveProgress) {
        setSaveError('Save progress is not available.');
        return false;
      }

      if (answers.length === 0) {
        setSaveError('No answers to save yet.');
        return false;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        await onSaveProgress(answers);
        return true;
      } catch (err: any) {
        const message = err?.message || 'Failed to save progress. Please try again.';
        setSaveError(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [onSaveProgress]
  );

  const clearError = useCallback(() => setSaveError(null), []);

  return { isSaving, saveError, saveProgress, clearError };
}
