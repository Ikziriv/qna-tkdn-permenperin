
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Question, UserAnswer, UserProfile } from '@/types';
import { QuestionNavPad, Modal, Spinner, Toast } from '@/components/ui';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import {
  saveProgressDebounced,
  loadProgress,
  clearProgress,
  flushDebouncedProgress,
} from '@/lib/sessionStorageProgress';
import { startQuizTracking, logQuizAnswerTracking, completeQuizTracking } from '@/lib/activityTracking';

interface QuizProps {
  questions: Question[];
  profile: UserProfile;
  onFinish: (answers: UserAnswer[], questions: Question[]) => void | Promise<void>;
  onSaveProgress?: (answers: UserAnswer[]) => Promise<void>;
  isAuthenticated?: boolean;
}

const Quiz: React.FC<QuizProps> = ({ questions, profile, onFinish, onSaveProgress, isAuthenticated = true }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'en' | 'id';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  
  // State for shuffled questions to keep them stable during the quiz
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const pendingAnswersRef = useRef<UserAnswer[]>([]);
  const okButtonRef = useRef<HTMLButtonElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '', type: 'info', visible: false,
  });

  // Form validation and progress saving
  const { isComplete, unansweredIndices, unansweredCount, answeredCount } = useFormValidation(shuffledQuestions, answers);
  const { isOnline } = useNetworkStatus();

  const DEFAULT_TIMER_SECONDS = 30 * 60;
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIMER_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // Initialize state and handle checkpoints from sessionStorage
  useEffect(() => {
    const saved = loadProgress();
    if (saved && saved.shuffledQuestions.length > 0) {
      setShuffledQuestions(saved.shuffledQuestions as Question[]);
      setCurrentIndex(saved.currentIndex);
      setAnswers(saved.answers);
      setTimeRemaining(saved.timeRemaining ?? DEFAULT_TIMER_SECONDS);
      return;
    }

    const shuffleData = () => {
      const shuffledQ = [...questions].sort(() => Math.random() - 0.5);
      const finalQuestions = shuffledQ.map(q => {
        const optionIndices = q.options.id.map((_, i) => i);
        for (let i = optionIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [optionIndices[i], optionIndices[j]] = [optionIndices[j], optionIndices[i]];
        }
        const newOptionsEn = optionIndices.map(i => q.options.en[i]);
        const newOptionsId = optionIndices.map(i => q.options.id[i]);
        const newCorrectIndex = optionIndices.indexOf(q.correctAnswerIndex);

        return {
          ...q,
          options: {
            en: newOptionsEn,
            id: newOptionsId
          },
          correctAnswerIndex: newCorrectIndex
        };
      });
      setShuffledQuestions(finalQuestions);
    };

    shuffleData();
    startQuizTracking();
  }, [questions]);

  // Debounced sessionStorage checkpoint
  useEffect(() => {
    if (shuffledQuestions.length > 0) {
      saveProgressDebounced({
        shuffledQuestions,
        currentIndex,
        answers,
        timeRemaining,
      }, 300);
    }
  }, [shuffledQuestions, currentIndex, answers, timeRemaining]);

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    answers.forEach(a => {
      const idx = shuffledQuestions.findIndex(q => q.id === a.questionId);
      if (idx !== -1) set.add(idx);
    });
    return set;
  }, [answers, shuffledQuestions]);

  const performSubmit = useCallback(async (answersToSubmit: UserAnswer[]) => {
    setIsSubmitting(true);
    setSubmitError('');

    const MIN_DURATION_MS = 1200;
    const startTime = Date.now();

    try {
      const result = onFinish(answersToSubmit, shuffledQuestions);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await result;
      }
      completeQuizTracking();
      flushDebouncedProgress();
      clearProgress();
    } catch (err: any) {
      setSubmitError(err.message || t('quiz.submitError'));
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION_MS - elapsed);
      setTimeout(() => {
        setIsSubmitting(false);
      }, remaining);
    }
  }, [onFinish, shuffledQuestions, t]);

  const handleConfirmFinish = useCallback(() => {
    setShowConfirmModal(false);
    performSubmit(pendingAnswersRef.current);
  }, [performSubmit]);

  useEffect(() => {
    if (showConfirmModal && okButtonRef.current) {
      okButtonRef.current.focus();
    }
  }, [showConfirmModal]);

  // Timer countdown
  useEffect(() => {
    if (shuffledQuestions.length === 0 || timerExpired || isSubmitting) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [shuffledQuestions.length, timerExpired, isSubmitting]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !timerExpired && !isSubmitting) {
      setTimerExpired(true);
      setShowConfirmModal(false);
      performSubmit(answers);
    }
  }, [timeRemaining, timerExpired, isSubmitting, answers, performSubmit]);

  // Show auto-saved indicator briefly after debounced write
  useEffect(() => {
    if (shuffledQuestions.length > 0 && answers.length > 0) {
      const timer = setTimeout(() => setAutoSaved(true), 400);
      const hideTimer = setTimeout(() => setAutoSaved(false), 2400);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [answers, shuffledQuestions.length]);

  // Handle loading state until initialization is complete
  if (shuffledQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerColor = timeRemaining < 60
    ? 'text-red-600'
    : timeRemaining < 300
    ? 'text-amber-600'
    : 'text-slate-400';

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === currentQuestion.id);

    if (existingIndex > -1) {
      newAnswers[existingIndex] = {
        questionId: currentQuestion.id,
        answerIndex: optionIndex,
      };
    } else {
      newAnswers.push({
        questionId: currentQuestion.id,
        answerIndex: optionIndex,
      });
    }

    setAnswers(newAnswers);

    // Track the answer event
    const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
    logQuizAnswerTracking(currentQuestion.id, optionIndex, isCorrect);

    // Auto-advance with a slight delay for visual feedback
    setTimeout(() => {
      if (currentIndex < shuffledQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleFinishClick = () => {
    pendingAnswersRef.current = answers;
    if (!isComplete) {
      setShowWarningModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const getLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Minimalist Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('quiz.questionOf', { current: currentIndex + 1, total: shuffledQuestions.length })}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${timerColor} transition-colors duration-300`}
              aria-live="polite"
              aria-label={t('quiz.timeLeft', { time: formatTime(timeRemaining) })}
            >
              {formatTime(timeRemaining)}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionNavPad
        total={shuffledQuestions.length}
        current={currentIndex}
        answered={answeredIndices}
        onNavigate={setCurrentIndex}
      />

      {!isAuthenticated && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-700">
            {t('quiz.guestQuizNotice')}
          </p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
        <div key={currentIndex} className="animate-in slide-in-from-right fade-in duration-500 fill-mode-both flex flex-col h-full">
          <div className="mb-8 p-4 md:p-8 border shadow-sm">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2 block">
              {currentQuestion.category[language]}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 uppercase leading-relaxed">
              {currentQuestion.text[language]}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-auto">
            {currentQuestion.options[language].map((option, idx) => {
              const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answerIndex === idx;
              const letter = getLetter(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`
                    w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center group
                    ${isSelected
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-4 transition-colors
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-400 group-hover:text-slate-600 border border-slate-200'
                    }
                  `}>
                    {letter}
                  </div>
                  <span className="font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="group text-slate-400 hover:text-blue-600 disabled:opacity-0 font-black text-sm uppercase tracking-widest transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t('quiz.back')}
        </button>

        <div className="flex items-center gap-3">
          {/* Auto-save + Network Status */}
          <div className="flex items-center gap-2">
            {autoSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 animate-in fade-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('quiz.autoSaved')}
              </span>
            )}
            {!isOnline && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 px-2 py-1 bg-amber-50 rounded-lg border border-amber-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {t('quiz.offline')}
              </span>
            )}
          </div>

          {/* Finish Button */}
          <button
            type="button"
            onClick={handleFinishClick}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]
              ${isComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
          >
            {isComplete ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {t('quiz.finish')}
            {!isComplete && (
              <span className="ml-1 text-xs opacity-80">
                ({answeredCount}/{shuffledQuestions.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Incomplete Warning Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        closeOnBackdropClick={false}
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 id="warning-title" className="text-lg font-bold text-slate-900 mb-2">
            {t('quiz.incompleteWarningTitle')}
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            {t('quiz.incompleteWarningDesc', { count: unansweredCount })}
          </p>

          {unansweredIndices.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-left max-h-40 overflow-y-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('quiz.unansweredQuestions')}
              </p>
              <div className="flex flex-wrap gap-2">
                {unansweredIndices.map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowWarningModal(false);
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                    {t('quiz.questionShort', { number: idx + 1 })}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowWarningModal(false);
                setShowConfirmModal(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
            >
              {t('quiz.proceedAnyway')}
            </button>
            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl border border-slate-200 active:scale-[0.98] transition-all"
            >
              {t('quiz.goBackToQuiz')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        closeOnBackdropClick={false}
        maxWidth="max-w-sm"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 id="confirm-title" className="text-lg font-bold text-slate-900 mb-2">
            {t('quiz.confirmSubmitTitle')}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {t('quiz.confirmSubmitDesc')}
          </p>
          <div className="space-y-3">
            <button
              ref={okButtonRef}
              type="button"
              onClick={handleConfirmFinish}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
              aria-describedby="confirm-title"
            >
              {t('quiz.confirmSubmitOk')}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl border border-slate-200 active:scale-[0.98] transition-all"
            >
              {t('quiz.cancel')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-300"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner size="h-12 w-12" color="border-blue-600" label={timerExpired ? t('quiz.timeUp') : t('quiz.processingQuiz')} />
          <p className="mt-4 text-sm font-semibold text-slate-600">
            {timerExpired ? t('quiz.timeUp') : t('quiz.processingQuiz')}
          </p>
        </div>
      )}

      {/* Error Retry */}
      {submitError && !isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-sm w-full text-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('quiz.submitError')}</h3>
            <p className="text-slate-500 text-sm mb-6">{submitError}</p>
            <button
              type="button"
              onClick={handleConfirmFinish}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
            >
              {t('quiz.retry')}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        duration={4000}
      />
    </div>
  );
};

export default Quiz;
