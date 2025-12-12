import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Difficulty } from '../types';

interface FileUploadProps {
  onGenerate: (file: File, base64: string, difficulty: Difficulty) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onGenerate, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'];
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Max 5MB.");
      return false;
    }
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, TXT, or Image.");
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Content = base64String.split(',')[1];
      onGenerate(file, base64Content, difficulty);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Upload Study Material</h2>
        <p className="text-gray-500 mt-2">Upload your notes (PDF, TXT, Images) and AI will generate a comprehensive exam.</p>
      </div>

      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}
          ${file ? 'bg-green-50 border-green-300' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          onChange={handleChange}
          accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
        />
        
        {file ? (
          <div className="flex flex-col items-center text-green-700">
            <CheckCircle className="w-12 h-12 mb-3" />
            <p className="font-medium text-lg">{file.name}</p>
            <p className="text-sm opacity-75">{(file.size / 1024).toFixed(1)} KB</p>
            <p className="mt-2 text-xs text-indigo-600 underline">Click to change</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <Upload className="w-12 h-12 mb-3 text-indigo-400" />
            <p className="font-medium text-lg">Click to upload or drag and drop</p>
            <p className="text-sm">PDF, TXT, JPG, PNG (Max 5MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
        <div className="flex space-x-2">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`flex-1 py-3 px-3 text-sm rounded-md border transition-all ${
                difficulty === level 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          The number of questions will be automatically determined by the content length and depth.
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!file} 
          isLoading={isLoading}
          className="w-full md:w-auto"
        >
          Generate Quiz
        </Button>
      </div>
    </div>
  );
};