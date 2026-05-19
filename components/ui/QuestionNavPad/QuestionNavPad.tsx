import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface QuestionNavPadProps {
  /** Total number of questions */
  total: number;
  /** Zero-based index of the currently active question */
  current: number;
  /** Set of zero-based indices that have been answered */
  answered: Set<number>;
  /** Callback when a question number is selected */
  onNavigate: (index: number) => void;
  /** Maximum questions per group before pagination kicks in */
  groupSize?: number;
}

const DEFAULT_GROUP_SIZE = 50;
const MIN_TOUCH_SIZE = 48; // WCAG 2.5.5 target size

export const QuestionNavPad: React.FC<QuestionNavPadProps> = ({
  total,
  current,
  answered,
  onNavigate,
  groupSize = DEFAULT_GROUP_SIZE,
}) => {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const count = Math.ceil(total / groupSize);
    return Array.from({ length: count }, (_, i) => ({
      start: i * groupSize,
      end: Math.min((i + 1) * groupSize, total) - 1,
      label: `${i * groupSize + 1}–${Math.min((i + 1) * groupSize, total)}`,
    }));
  }, [total, groupSize]);

  // Auto-expand the group that contains the current question
  const initialExpanded = useMemo(() => {
    const idx = Math.floor(current / groupSize);
    return new Set<number>([idx]);
  }, [current, groupSize]);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(initialExpanded);

  const toggleGroup = useCallback((groupIndex: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupIndex)) {
        next.delete(groupIndex);
      } else {
        next.add(groupIndex);
      }
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigate(index);
      }
    },
    [onNavigate]
  );

  return (
    <nav
      className="w-full mb-2"
      aria-label={t('quiz.questionNavPad')}
      role="region"
    >
      <div className="space-y-3">
        {groups.map((group, groupIdx) => {
          const isExpanded = expandedGroups.has(groupIdx);
          const isCurrentInGroup = current >= group.start && current <= group.end;

          return (
            <div
              key={groupIdx}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
            >
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => toggleGroup(groupIdx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  aria-expanded={isExpanded}
                  aria-controls={`qnav-group-${groupIdx}`}
                >
                  <span>
                    {t('quiz.questionsRange', {
                      from: group.start + 1,
                      to: group.end + 1,
                    })}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}

              {isExpanded && (
                <div
                  id={`qnav-group-${groupIdx}`}
                  className="p-3"
                  role="list"
                >
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from(
                      { length: group.end - group.start + 1 },
                      (_, i) => group.start + i
                    ).map(index => {
                      const isAnswered = answered.has(index);
                      const isActive = index === current;

                      let statusLabel: string;
                      if (isActive && isAnswered) {
                        statusLabel = t('quiz.questionStatusActiveAnswered', {
                          number: index + 1,
                        });
                      } else if (isActive) {
                        statusLabel = t('quiz.questionStatusActive', {
                          number: index + 1,
                        });
                      } else if (isAnswered) {
                        statusLabel = t('quiz.questionStatusAnswered', {
                          number: index + 1,
                        });
                      } else {
                        statusLabel = t('quiz.questionStatusUnanswered', {
                          number: index + 1,
                        });
                      }

                      return (
                        <button
                          key={index}
                          type="button"
                          role="listitem"
                          onClick={() => onNavigate(index)}
                          onKeyDown={e => handleKeyDown(e, index)}
                          aria-label={statusLabel}
                          aria-current={isActive ? 'true' : undefined}
                          title={
                            isActive
                              ? t('quiz.currentQuestionTooltip', {
                                  number: index + 1,
                                })
                              : statusLabel
                          }
                          className={`
                            relative flex items-center justify-center
                            rounded-xl text-sm font-bold
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                            min-w-[${MIN_TOUCH_SIZE}px] min-h-[${MIN_TOUCH_SIZE}px]
                            ${
                              isActive
                                ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 z-10'
                                : ''
                            }
                            ${
                              isAnswered
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-rose-500 text-white hover:bg-rose-600'
                            }
                          `}
                          style={{
                            minWidth: MIN_TOUCH_SIZE,
                            minHeight: MIN_TOUCH_SIZE,
                          }}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span>{t('quiz.answeredLegend')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
          <span>{t('quiz.unansweredLegend')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-600 ring-2 ring-blue-600 ring-offset-1 inline-block" />
          <span>{t('quiz.currentLegend')}</span>
        </div>
      </div>
    </nav>
  );
};
