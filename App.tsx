
import React, { useState, createContext, useContext } from 'react';
import { UserProfile, UserAnswer, AppState, Language } from './types';
import { ASSESSMENT_QUESTIONS } from './constants';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Quiz from './components/Quiz';
import Results from './components/Results';

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
  const [language, setLanguage] = useState<Language>('id');

  const handleStart = (userProfile: UserProfile) => {
    setProfile(userProfile);
    setCurrentState(AppState.QUIZ);
  };

  const handleFinish = (userAnswers: UserAnswer[]) => {
    setAnswers(userAnswers);
    setCurrentState(AppState.RESULTS);
  };

  const handleRestart = () => {
    setProfile(null);
    setAnswers([]);
    setCurrentState(AppState.ONBOARDING);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <Layout>
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
            questions={ASSESSMENT_QUESTIONS}
            onRestart={handleRestart}
          />
        )}
      </Layout>
    </LanguageContext.Provider>
  );
};

export default App;
