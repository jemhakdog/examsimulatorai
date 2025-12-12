import React from 'react';
import { QuizResult } from '../types';
import { Button } from './Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RotateCcw, Download, Share2 } from 'lucide-react';

interface ResultsViewProps {
  result: QuizResult;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset }) => {
  const percentage = Math.round((result.score / result.total) * 100);
  
  const data = [
    { name: 'Correct', value: result.score, color: '#10B981' },
    { name: 'Incorrect', value: result.total - result.score, color: '#EF4444' },
  ];

  let feedback = "";
  if (percentage >= 90) feedback = "Excellent! You've mastered this topic.";
  else if (percentage >= 70) feedback = "Great job! You have a solid understanding.";
  else if (percentage >= 50) feedback = "Good effort. Review the incorrect answers to improve.";
  else feedback = "Keep studying. Focus on the concepts explained in the feedback.";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Exam Complete!</h2>
          <p className="text-indigo-100">{feedback}</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Score Chart */}
          <div className="flex flex-col items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute mt-2 text-center">
              <div className="text-4xl font-bold text-gray-800">{percentage}%</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{result.total}</div>
                <div className="text-sm text-gray-500">Total Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{result.score}</div>
                <div className="text-sm text-green-700">Correct</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{result.total - result.score}</div>
                <div className="text-sm text-red-700">Incorrect</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{(result.score * 10)}</div>
                <div className="text-sm text-blue-700">XP Earned</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={onReset} className="flex-1 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another
              </Button>
              <Button variant="outline" className="flex-1 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Save PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Review */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800 ml-1">Detailed Review</h3>
        {result.questions.map((q, idx) => {
          const userAnswer = result.userAnswers[idx];
          const isCorrect = userAnswer === q.correctAnswerIndex;

          return (
            <div key={q.id} className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  <span className="text-gray-400 mr-2">{idx + 1}.</span>
                  {q.text}
                </h4>
                {isCorrect ? (
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Correct</span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Incorrect</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, optIdx) => {
                  let style = "p-3 rounded border text-sm ";
                  if (optIdx === q.correctAnswerIndex) style += "bg-green-50 border-green-200 text-green-800 font-medium";
                  else if (optIdx === userAnswer && !isCorrect) style += "bg-red-50 border-red-200 text-red-800";
                  else style += "bg-gray-50 border-gray-100 text-gray-500";
                  
                  return (
                    <div key={optIdx} className={style}>
                       {String.fromCharCode(65 + optIdx)}. {opt}
                       {optIdx === q.correctAnswerIndex && <span className="float-right text-xs"> (Correct Answer)</span>}
                       {optIdx === userAnswer && !isCorrect && <span className="float-right text-xs"> (Your Answer)</span>}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <span className="font-semibold text-gray-700">Explanation: </span>
                {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};