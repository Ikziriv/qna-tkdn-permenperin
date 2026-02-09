
import React, { useState } from 'react';
import { Question, UserAnswer, UserProfile } from '../types';
import { useLanguage } from '../App';
import { translations } from '../translations';

interface QuizProps {
  questions: Question[];
  profile: UserProfile;
  onFinish: (answers: UserAnswer[]) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, profile, onFinish }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === currentQuestion.id);

    if (existingIndex > -1) {
      newAnswers[existingIndex] = { questionId: currentQuestion.id, answerIndex: optionIndex };
    } else {
      newAnswers.push({ questionId: currentQuestion.id, answerIndex: optionIndex });
    }

    setAnswers(newAnswers);

    // Auto-advance with a slight delay for visual feedback
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinish(newAnswers);
      }
    }, 300);
  };

  const getLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Minimalist Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.questionOf.replace('{current}', (currentIndex + 1).toString()).replace('{total}', questions.length.toString())}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
        <div key={currentIndex} className="animate-in slide-in-from-right fade-in duration-500 fill-mode-both flex flex-col h-full">
          <div className="mb-8">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2 block">
              {currentQuestion.category[language]}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
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

      <div className="mt-10 flex justify-between items-center px-4">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="group text-slate-400 hover:text-blue-600 disabled:opacity-0 font-black text-sm uppercase tracking-widest transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t.back}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
            ))}
          </div>
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
            {t.draftingFor.replace('{name}', profile.name)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
