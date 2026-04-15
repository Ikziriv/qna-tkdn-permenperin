
import React, { useState, createContext, useContext } from 'react';
import { UserProfile, UserAnswer, AppState, Language, Question } from './types';
import { ASSESSMENT_QUESTIONS } from './constants';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Quiz from './components/Quiz';
import Results from './components/Results';
import ResumeModal from './components/ResumeModal';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [language, setLanguage] = useState<Language>('id');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [detectedSession, setDetectedSession] = useState<{
    state: AppState;
    profile: UserProfile;
    answers: UserAnswer[];
    questions: Question[];
  } | null>(null);

  // Load initial state from localStorage
  React.useEffect(() => {
    const savedProfile = localStorage.getItem('tkdn_profile');
    const savedLanguage = localStorage.getItem('tkdn_lang');
    const savedState = localStorage.getItem('tkdn_state');
    const savedAnswers = localStorage.getItem('tkdn_answers');
    const savedQuestions = localStorage.getItem('tkdn_quiz_questions');
    const checkpoint = localStorage.getItem('tkdn_quiz_checkpoint');

    if (savedLanguage) setLanguage(savedLanguage as Language);
    
    // Check if there is something to resume
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
      // We set the profile immediately so Onboarding is pre-filled if they choose to see it
      setProfile(JSON.parse(savedProfile));
    } else {
      // Normal load if no active session or they were just on onboarding
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedState) setCurrentState(savedState as AppState);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedQuestions) setQuizQuestions(JSON.parse(savedQuestions));
    }
  }, []);

  // Persist important state pieces
  React.useEffect(() => {
    localStorage.setItem('tkdn_lang', language);
    localStorage.setItem('tkdn_state', currentState);
    if (profile) localStorage.setItem('tkdn_profile', JSON.stringify(profile));
    if (answers.length > 0) localStorage.setItem('tkdn_answers', JSON.stringify(answers));
    if (quizQuestions.length > 0) localStorage.setItem('tkdn_quiz_questions', JSON.stringify(quizQuestions));
  }, [language, currentState, profile, answers, quizQuestions]);

  const handleResume = () => {
    if (detectedSession) {
      setProfile(detectedSession.profile);
      setAnswers(detectedSession.answers);
      setQuizQuestions(detectedSession.questions);
      setCurrentState(detectedSession.state);
    }
    setShowResumeModal(false);
  };

  const handleStart = (userProfile: UserProfile) => {
    setProfile(userProfile);
    setCurrentState(AppState.QUIZ);
    // Explicitly clear any old quiz session when starting fresh
    localStorage.removeItem('tkdn_quiz_checkpoint');
  };

  const handleFinish = (userAnswers: UserAnswer[], questions: Question[]) => {
    setAnswers(userAnswers);
    setQuizQuestions(questions);
    setCurrentState(AppState.RESULTS);
    // Clear checkpoint when finished
    localStorage.removeItem('tkdn_quiz_checkpoint');
  };

  const handleRestart = () => {
    // We keep the profile but reset the rest to allow "remembering" the user
    setAnswers([]);
    setQuizQuestions([]);
    setCurrentState(AppState.ONBOARDING);
    setShowResumeModal(false);
    localStorage.removeItem('tkdn_state');
    localStorage.removeItem('tkdn_answers');
    localStorage.removeItem('tkdn_quiz_questions');
    localStorage.removeItem('tkdn_quiz_checkpoint');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <Layout>
        {showResumeModal && (
          <ResumeModal 
            language={language} 
            onContinue={handleResume} 
            onRestart={handleRestart} 
          />
        )}

        {currentState === AppState.ONBOARDING && (
          <Onboarding onStart={handleStart} />
        )}
        
        {currentState === AppState.QUIZ && profile && (
          <Quiz 
            profile={profile}
            questions={ASSESSMENT_QUESTIONS} 
            onFinish={handleFinish} 
          />
        )}
        
        {currentState === AppState.RESULTS && profile && (
          <Results 
            profile={profile} 
            answers={answers} 
            questions={quizQuestions}
            onRestart={handleRestart}
          />
        )}
      </Layout>
    </LanguageContext.Provider>
  );
};

export default App;
