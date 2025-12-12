import React, { useState } from 'react';
import { Question } from '../types';
import { Button } from './Button';
import { CheckCircle, XCircle, ArrowRight, Flag } from 'lucide-react';

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (userAnswers: number[]) => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== -1;

  const handleOptionSelect = (optionIndex: number) => {
    if (hasAnsweredCurrent) return; // Prevent changing answer in practice mode instantly? Let's allow change until confirmed or instant feedback.
    // For this specific design, let's do instant feedback per question to make it a study tool.
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(selectedAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              // Fix: Added bg-white and text-gray-700 to ensure visibility
              let buttonStyle = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300";
              let icon = null;

              if (hasAnsweredCurrent) {
                if (idx === currentQuestion.correctAnswerIndex) {
                  buttonStyle = "bg-green-50 border-green-500 text-green-700";
                  icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                } else if (idx === selectedAnswers[currentIndex]) {
                  buttonStyle = "bg-red-50 border-red-500 text-red-700";
                  icon = <XCircle className="w-5 h-5 text-red-600" />;
                } else {
                  // Fix: Added bg-white and text-gray-500 for unselected options in answered state
                  buttonStyle = "bg-white border-gray-200 text-gray-400 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all flex justify-between items-center group ${buttonStyle}`}
                >
                  <span className="flex items-center">
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs mr-3 opacity-60">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {showExplanation && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in">
              <div className="flex items-start">
                <Flag className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Explanation</h4>
                  <p className="text-blue-800 text-sm mt-1">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
          <Button 
            onClick={handleNext} 
            disabled={!hasAnsweredCurrent}
            className="flex items-center"
          >
            {isLastQuestion ? 'Finish Exam' : 'Next Question'}
            {!isLastQuestion && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};