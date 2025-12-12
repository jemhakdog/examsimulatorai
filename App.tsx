import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Settings, Plus, History } from 'lucide-react';
import { AppState, Difficulty, Question, QuizResult, AISettings, QuizHistoryItem } from './types';
import { FileUpload } from './components/FileUpload';
import { QuizInterface } from './components/QuizInterface';
import { ResultsView } from './components/ResultsView';
import { SettingsModal } from './components/SettingsModal';
import { HistoryList } from './components/HistoryList';
import { generateQuizFromContent } from './services/geminiService';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  gemini: {
    apiKey: ''
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o'
  }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Settings & History State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('exam_simulator_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Merge with default to ensure new fields (like gemini object) exist if loading old settings
        setAiSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    const savedHistory = localStorage.getItem('exam_simulator_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    localStorage.setItem('exam_simulator_settings', JSON.stringify(newSettings));
  };

  const saveToHistory = (fileName: string, difficulty: Difficulty, questions: Question[]) => {
    const newItem: QuizHistoryItem = {
      id: Date.now().toString(),
      fileName,
      date: new Date().toISOString(),
      difficulty,
      questions
    };
    
    // Keep last 20 items to avoid localStorage limits
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('exam_simulator_history', JSON.stringify(updatedHistory));
  };

  const handleDeleteHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('exam_simulator_history', JSON.stringify(updatedHistory));
  };

  const handleGenerateQuiz = async (file: File, base64: string, difficulty: Difficulty) => {
    setIsLoading(true);
    setAppState(AppState.PROCESSING);
    
    try {
      // Pass settings to the service
      const response = await generateQuizFromContent(base64, file.type, difficulty, aiSettings);
      
      const mappedQuestions: Question[] = response.questions.map((q, idx) => ({
        id: idx,
        text: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation
      }));

      setQuestions(mappedQuestions);
      saveToHistory(file.name, difficulty, mappedQuestions);
      setAppState(AppState.QUIZ);
    } catch (error: any) {
      console.error(error);
      alert(`Generation Failed: ${error.message || "Unknown error"}`);
      setAppState(AppState.UPLOAD);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (item: QuizHistoryItem) => {
    setQuestions(item.questions);
    setAppState(AppState.QUIZ);
  };

  const handleQuizComplete = (userAnswers: number[]) => {
    const score = userAnswers.reduce((acc, answer, idx) => {
      return answer === questions[idx].correctAnswerIndex ? acc + 1 : acc;
    }, 0);

    setResult({
      score,
      total: questions.length,
      userAnswers,
      questions
    });
    setAppState(AppState.RESULTS);
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setQuestions([]);
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">ExamSimulator<span className="text-indigo-600">.ai</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100"
              title="AI Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button className="text-gray-500 hover:text-indigo-600 transition-colors">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {appState === AppState.UPLOAD && (
            <div className="animate-fade-in-up">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 sm:text-5xl">
                  Turn Notes into <span className="text-indigo-600">Acing Exams</span>
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Upload your lecture slides, textbooks, or handwritten notes. 
                  Our AI will instantly analyze the topics and generate a comprehensive practice exam.
                </p>
                {aiSettings.provider === 'openai' && (
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Using Custom OpenAI Model: {aiSettings.openai.model}
                  </span>
                )}
                {aiSettings.provider === 'gemini' && aiSettings.gemini?.apiKey && (
                   <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Using Custom Gemini API Key
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${
                      activeTab === 'create' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Exam
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${
                      activeTab === 'history' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Recent Exams
                  </button>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                {activeTab === 'create' ? (
                  <FileUpload onGenerate={handleGenerateQuiz} isLoading={isLoading} />
                ) : (
                  <HistoryList 
                    history={history} 
                    onSelect={handleLoadFromHistory} 
                    onDelete={handleDeleteHistory}
                  />
                )}
              </div>
            </div>
          )}

          {appState === AppState.PROCESSING && (
            <div className="flex flex-col items-center justify-center h-96 animate-pulse">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
              <h3 className="text-2xl font-bold text-gray-800">Analyzing Content...</h3>
              <p className="text-gray-500 mt-2">Identifying key topics and generating questions using {aiSettings.provider === 'gemini' ? 'Gemini' : aiSettings.openai.model}...</p>
            </div>
          )}

          {appState === AppState.QUIZ && (
             <div className="animate-fade-in">
                <QuizInterface questions={questions} onComplete={handleQuizComplete} />
             </div>
          )}

          {appState === AppState.RESULTS && result && (
            <div className="animate-fade-in">
              <ResultsView result={result} onReset={handleReset} />
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Smart Exam Simulator. Powered by {aiSettings.provider === 'gemini' ? 'Gemini' : 'AI'}.</p>
        </div>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;