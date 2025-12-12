import React from 'react';
import { Clock, FileText, ChevronRight, Trash2, BarChart } from 'lucide-react';
import { QuizHistoryItem, Difficulty } from '../types';
import { Button } from './Button';

interface HistoryListProps {
  history: QuizHistoryItem[];
  onSelect: (item: QuizHistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No recent exams</h3>
        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
          Generated exams will appear here so you can retake them anytime.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY: return 'bg-green-100 text-green-800';
      case Difficulty.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case Difficulty.HARD: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {history.map((item) => (
        <div 
          key={item.id}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-indigo-50 p-3 rounded-lg flex-shrink-0">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 line-clamp-1" title={item.fileName}>
                {item.fileName}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(item.date)}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{item.questions.length} Questions</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(item.difficulty)}`}>
                  {item.difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Exam"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <Button 
              onClick={() => onSelect(item)} 
              variant="outline" 
              className="flex-1 sm:flex-none text-sm py-2"
            >
              Retake Exam
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};