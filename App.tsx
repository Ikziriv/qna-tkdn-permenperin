import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserProfile, UserAnswer, AppState, AuthUser, Question } from './types';
import { ASSESSMENT_QUESTIONS } from './constants';
import { api, clearTokens, getRefreshToken } from './lib/api';
import { LanguageProvider } from '@/components/providers';
import { AppLayout } from '@/components/layout';
import { OnboardingForm } from '@/components/feature/onboarding';
import { QuizContainer, ResumeModal } from '@/components/feature/quiz';
import { AuthForm } from '@/components/feature/auth';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingProvider, useLoading } from '@/contexts/LoadingContext';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import AdminRouter from '@/components/AdminRouter';

/** Lazy-load heavy feature components to reduce initial bundle size. */
const ResultsContainer = lazy(() => import('@/components/feature/results/ResultsContainer/ResultsContainer'));
const QuizHistoryContainer = lazy(() => import('@/components/feature/history/QuizHistoryContainer/QuizHistoryContainer'));

const PROTECTED_STATES = [AppState.RESULTS, AppState.HISTORY, AppState.ADMIN];

const App: React.FC = () => {
  const { t } = useTranslation();
  const { authUser, setAuthUser } = useAuth();
  const { startLoading, stopLoading, setLoadingError } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname.startsWith('/admin');

  const [currentState, setCurrentState] = useState<AppState>(AppState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [detectedSession, setDetectedSession] = useState<{
    state: AppState;
    profile: UserProfile;
    answers: UserAnswer[];
    questions: Question[];
  } | null>(null);
  const [postLoginRedirect, setPostLoginRedirect] = useState<AppState | null>(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [anonymousSessionToken, setAnonymousSessionToken] = useState<string | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null);

  // Sync currentState with admin URL
  React.useEffect(() => {
    if (currentState === AppState.ADMIN && !isAdminPath) {
      startLoading();
      navigate('/admin');
      stopLoading();
    }
  }, [currentState, isAdminPath, navigate, startLoading, stopLoading]);

  React.useEffect(() => {
    if (!isAdminPath && currentState === AppState.ADMIN) {
      setCurrentState(AppState.ONBOARDING);
    }
  }, [isAdminPath, currentState]);

  // Guard state changes: unauthenticated users cannot access protected states
  const navigateTo = useCallback((state: AppState) => {
    startLoading();
    try {
      if (PROTECTED_STATES.includes(state) && !authUser) {
        setPostLoginRedirect(state);
        let msg = t('messages.signInToContinue');
        if (state === AppState.HISTORY) msg = t('messages.signInForHistory');
        if (state === AppState.RESULTS) msg = t('messages.signInForResults');
        if (state === AppState.ADMIN) msg = t('messages.adminAuthRequired');
        setLoginMessage(msg);
        setCurrentState(AppState.AUTH);
        return;
      }
      setCurrentState(state);
    } catch (err: any) {
      setLoadingError(err?.message || 'Navigation failed');
    } finally {
      stopLoading();
    }
  }, [authUser, t, startLoading, stopLoading, setLoadingError]);

  // Validate token and restore session on mount
  React.useEffect(() => {
    const token = localStorage.getItem('tkdn_token');
    if (!token) {
      const savedState = localStorage.getItem('tkdn_state');
      const savedProfile = localStorage.getItem('tkdn_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedState && savedState !== AppState.AUTH && savedState !== AppState.ADMIN) {
        setCurrentState(savedState as AppState);
      } else {
        setCurrentState(AppState.ONBOARDING);
      }
      const savedAnswers = localStorage.getItem('tkdn_answers');
      const savedQuestions = localStorage.getItem('tkdn_quiz_questions');
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedQuestions) setQuizQuestions(JSON.parse(savedQuestions));
      return;
    }

    api.auth.me()
      .then((data) => {
        const user = data.user as AuthUser;
        setAuthUser(user);
        if (user.role === 'admin' || user.role === 'super_admin') {
          setCurrentState(AppState.ADMIN);
        } else {
          restoreQuizSession();
        }
      })
      .catch(() => {
        clearTokens();
        setCurrentState(AppState.ONBOARDING);
      });
  }, []);

  // Listen for global session expiration events from API client
  React.useEffect(() => {
    const handler = () => {
      clearTokens();
      setAuthUser(null);
      setProfile(null);
      setAnswers([]);
      setQuizQuestions([]);
      setCurrentState(AppState.AUTH);
      setShowResumeModal(false);
      setDetectedSession(null);
      setLoginMessage(t('messages.sessionExpired'));
    };
    window.addEventListener('auth:sessionExpired', handler);
    return () => window.removeEventListener('auth:sessionExpired', handler);
  }, []);

  const restoreQuizSession = () => {
    const savedProfile = localStorage.getItem('tkdn_profile');
    const savedState = localStorage.getItem('tkdn_state');
    const savedAnswers = localStorage.getItem('tkdn_answers');
    const savedQuestions = localStorage.getItem('tkdn_quiz_questions');
    const checkpoint = localStorage.getItem('tkdn_quiz_checkpoint');

    const hasActiveQuiz = !!checkpoint;
    const hasResults = savedState === AppState.RESULTS && savedAnswers && savedQuestions;

    if (savedProfile && (hasActiveQuiz || hasResults)) {
      setDetectedSession({
        state: hasActiveQuiz ? AppState.QUIZ : (savedState as AppState),
        profile: JSON.parse(savedProfile),
        answers: savedAnswers ? JSON.parse(savedAnswers) : [],
        questions: savedQuestions ? JSON.parse(savedQuestions) : [],
      });
      setShowResumeModal(true);
      setProfile(JSON.parse(savedProfile));
    } else {
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedState && savedState !== AppState.AUTH && savedState !== AppState.ADMIN) {
        setCurrentState(savedState as AppState);
      } else {
        setCurrentState(AppState.ONBOARDING);
      }
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedQuestions) setQuizQuestions(JSON.parse(savedQuestions));
    }
  };

  const handleLogin = useCallback(async (user: AuthUser, token: string, refreshToken?: string) => {
    setAuthUser(user);
    if (refreshToken) {
      localStorage.setItem('tkdn_token', token);
      localStorage.setItem('tkdn_refresh_token', refreshToken);
    }

    const anonToken = anonymousSessionToken || sessionStorage.getItem('tkdn_anon_token');
    if (anonToken) {
      try {
        await api.quiz.anonymous.link(anonToken);
        sessionStorage.removeItem('tkdn_anon_token');
        setAnonymousSessionToken(null);
      } catch (err) {
        console.error("Failed to link anonymous attempt:", err);
      }
    }

    if (postLoginRedirect) {
      setCurrentState(postLoginRedirect);
      setPostLoginRedirect(null);
      setLoginMessage("");
      return;
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      setCurrentState(AppState.ADMIN);
    } else {
      restoreQuizSession();
    }
  }, [postLoginRedirect, anonymousSessionToken]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try { await api.auth.logout(refreshToken); } catch { /* ignore */ }
    }
    clearTokens();
    localStorage.removeItem('tkdn_profile');
    localStorage.removeItem('tkdn_state');
    localStorage.removeItem('tkdn_answers');
    localStorage.removeItem('tkdn_quiz_questions');
    localStorage.removeItem('tkdn_quiz_checkpoint');
    setAuthUser(null);
    setProfile(null);
    setAnswers([]);
    setQuizQuestions([]);
    setCurrentState(AppState.AUTH);
    setShowResumeModal(false);
    if (isAdminPath) {
      startLoading();
      navigate('/');
      stopLoading();
    }
    setDetectedSession(null);
    setPostLoginRedirect(null);
    setLoginMessage("");
    setAnonymousSessionToken(null);
    sessionStorage.removeItem('tkdn_anon_token');
  };

  // Persist important state pieces
  React.useEffect(() => {
    if (currentState !== AppState.AUTH) {
      localStorage.setItem('tkdn_state', currentState);
    }
    if (profile) localStorage.setItem('tkdn_profile', JSON.stringify(profile));
    if (answers.length > 0) localStorage.setItem('tkdn_answers', JSON.stringify(answers));
    if (quizQuestions.length > 0) localStorage.setItem('tkdn_quiz_questions', JSON.stringify(quizQuestions));
  }, [currentState, profile, answers, quizQuestions]);

  const handleResume = () => {
    startLoading();
    if (detectedSession) {
      setProfile(detectedSession.profile);
      setAnswers(detectedSession.answers);
      setQuizQuestions(detectedSession.questions);
      setCurrentState(detectedSession.state);
    }
    setShowResumeModal(false);
    stopLoading();
  };

  const handleStart = (userProfile: UserProfile) => {
    startLoading();
    setProfile(userProfile);
    setCurrentState(AppState.QUIZ);
    localStorage.removeItem('tkdn_quiz_checkpoint');
    stopLoading();
  };

  const handleFinish = async (userAnswers: UserAnswer[], questions: Question[]) => {
    startLoading();
    setAnswers(userAnswers);
    setQuizQuestions(questions);
    setCurrentState(AppState.RESULTS);
    localStorage.removeItem('tkdn_quiz_checkpoint');

    const correctAnswers = userAnswers.filter((ua) => {
      const q = questions.find((q) => q.id === ua.questionId);
      return q && q.correctAnswerIndex === ua.answerIndex;
    }).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const responses = userAnswers.map((ua) => {
      const q = questions.find((q) => q.id === ua.questionId);
      return {
        questionId: ua.questionId,
        selectedAnswerIndex: ua.answerIndex,
        isCorrect: q ? q.correctAnswerIndex === ua.answerIndex : false,
      };
    });

    if (authUser) {
      try {
        const attemptRes = await api.quiz.createAttempt({
          quizId: 1,
          totalQuestions: questions.length,
        });
        await api.quiz.completeAttempt(attemptRes.attempt.id, {
          score,
          correctAnswers,
          timeSpentSeconds: 0,
        });
        await api.quiz.saveResponses({
          attemptId: attemptRes.attempt.id,
          responses,
        });
      } catch (err) {
        console.error("Failed to persist quiz results:", err);
      }
    } else {
      try {
        const startRes = await api.quiz.anonymous.start({
          quizId: 1,
          totalQuestions: questions.length,
        });
        const startData = await startRes.json();
        if (startData.sessionToken) {
          setAnonymousSessionToken(startData.sessionToken);
          sessionStorage.setItem('tkdn_anon_token', startData.sessionToken);

          await api.quiz.anonymous.complete(startData.sessionToken, {
            score,
            correctAnswers,
            timeSpentSeconds: 0,
            responses,
          });
        }
      } catch (err) {
        console.error("Failed to persist anonymous quiz results:", err);
      }
    }
    stopLoading();
  };

  const handleSaveProgress = async (userAnswers: UserAnswer[]) => {
    if (!authUser) {
      throw new Error('Login required to save progress.');
    }

    let attemptId = currentAttemptId;

    // Lazy-create attempt on first save
    if (!attemptId) {
      try {
        const attemptRes = await api.quiz.createAttempt({
          quizId: 1,
          totalQuestions: ASSESSMENT_QUESTIONS.length,
        });
        attemptId = attemptRes.attempt.id;
        setCurrentAttemptId(attemptId);
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to create attempt.');
      }
    }

    const responses = userAnswers.map((ua) => {
      const q = ASSESSMENT_QUESTIONS.find((q) => q.id === ua.questionId);
      return {
        questionId: ua.questionId,
        selectedAnswerIndex: ua.answerIndex,
        isCorrect: q ? q.correctAnswerIndex === ua.answerIndex : false,
      };
    });

    try {
      await api.quiz.saveResponses({
        attemptId: attemptId!,
        responses,
      });
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to save responses.');
    }
  };

  const handleRestart = () => {
    setAnswers([]);
    setQuizQuestions([]);
    setCurrentState(AppState.ONBOARDING);
    setShowResumeModal(false);
    setCurrentAttemptId(null);
    localStorage.removeItem('tkdn_state');
    localStorage.removeItem('tkdn_answers');
    localStorage.removeItem('tkdn_quiz_questions');
    localStorage.removeItem('tkdn_quiz_checkpoint');
  };

  const isAdminLevel = authUser?.role === 'admin' || authUser?.role === 'super_admin';
  const isDashboardView = isAdminPath && isAdminLevel;

  return (
    <LanguageProvider>
      <LoadingOverlay />
      <AppLayout
        fullWidth={isDashboardView}
        hideHeader={currentState === AppState.AUTH}
        onSignIn={() => {
          startLoading();
          if (currentState !== AppState.AUTH) {
            setPostLoginRedirect(currentState);
          }
          setLoginMessage(t('messages.signInToContinue'));
          setCurrentState(AppState.AUTH);
          stopLoading();
        }}
      >
        {authUser && (
          <div className={`${isDashboardView ? 'w-full px-8' : 'max-w-7xl mx-auto px-4'} py-4 sticky top-0 z-40`}>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm px-4 py-2.5">
              {/* User info */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {authUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold text-slate-800">{authUser.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${
                    authUser.role === 'super_admin'
                      ? 'text-purple-600'
                      : authUser.role === 'admin'
                      ? 'text-blue-600'
                      : 'text-slate-500'
                  }`}>
                    {authUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Tab navigation */}
              <div className="flex items-center gap-1">
                {(authUser.role === 'admin' || authUser.role === 'super_admin') && !isAdminPath && (
                  <button
                    onClick={() => {
                      startLoading();
                      setCurrentState(AppState.ADMIN);
                      stopLoading();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {t('appNav.dashboard')}
                  </button>
                )}
                {(authUser.role === 'admin' || authUser.role === 'super_admin') && isAdminPath && (
                  <button
                    onClick={() => {
                      startLoading();
                      setCurrentState(AppState.ONBOARDING);
                      navigate('/');
                      stopLoading();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {t('appNav.quiz')}
                  </button>
                )}
                {currentState !== AppState.HISTORY && (
                  <button
                    onClick={() => {
                      startLoading();
                      setCurrentState(AppState.HISTORY);
                      stopLoading();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {t('appNav.history')}
                  </button>
                )}
                {currentState === AppState.HISTORY && (
                  <button
                    onClick={() => {
                      startLoading();
                      setCurrentState(AppState.ONBOARDING);
                      stopLoading();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm"
                  >
                    {t('appNav.quiz')}
                  </button>
                )}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('appNav.logout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAdminPath && showResumeModal && (
          <ResumeModal
            onContinue={handleResume}
            onRestart={handleRestart}
          />
        )}

        {!isAdminPath && currentState === AppState.AUTH && (
          <AuthForm
            onLogin={handleLogin}
            message={loginMessage}
            onBackToHome={() => {
              startLoading();
              setCurrentState(AppState.ONBOARDING);
              stopLoading();
            }}
          />
        )}

        {isAdminPath && (
          <AdminRouter />
        )}

        {!isAdminPath && currentState === AppState.ONBOARDING && (
          <OnboardingForm onStart={handleStart} />
        )}

        {!isAdminPath && currentState === AppState.QUIZ && profile && (
          <QuizContainer
            profile={profile}
            questions={ASSESSMENT_QUESTIONS}
            onFinish={handleFinish}
            onSaveProgress={handleSaveProgress}
            isAuthenticated={!!authUser}
          />
        )}

        {!isAdminPath && currentState === AppState.RESULTS && profile && (
          <Suspense fallback={<Spinner className="min-h-[400px]" />}>
            <ResultsContainer
              profile={profile}
              answers={answers}
              questions={quizQuestions}
              onRestart={handleRestart}
              isAuthenticated={!!authUser}
              onRegisterRequired={() => {
                startLoading();
                setPostLoginRedirect(AppState.RESULTS);
                const totalScore = answers.filter(a => {
                  const q = quizQuestions.find(q => q.id === a.questionId);
                  return q?.correctAnswerIndex === a.answerIndex;
                }).length;
                setLoginMessage(t('results.unlockFullReportDesc', { score: totalScore, total: quizQuestions.length }));
                setCurrentState(AppState.AUTH);
                stopLoading();
              }}
            />
          </Suspense>
        )}

        {!isAdminPath && currentState === AppState.HISTORY && authUser && (
          <Suspense fallback={<Spinner className="min-h-[400px]" />}>
            <QuizHistoryContainer
              onBack={() => {
                startLoading();
                setCurrentState(AppState.ONBOARDING);
                stopLoading();
              }}
            />
          </Suspense>
        )}
      </AppLayout>
    </LanguageProvider>
  );
};

export default App;
