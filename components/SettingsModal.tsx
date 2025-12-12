import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AISettings>(settings);

  // Reset form data when modal opens with current settings
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'provider') {
      setFormData(prev => ({ ...prev, provider: value as AIProvider }));
    } else if (name === 'geminiApiKey') {
      setFormData(prev => ({
        ...prev,
        gemini: {
          ...prev.gemini,
          apiKey: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        openai: {
          ...prev.openai,
          [name]: value
        }
      }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                AI Model Settings
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI Compatible (OpenAI, Groq, Ollama)</option>
                </select>
              </div>

              {formData.provider === 'gemini' && (
                <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key (Optional)</label>
                    <input
                      type="password"
                      name="geminiApiKey"
                      value={formData.gemini?.apiKey || ''}
                      onChange={handleChange}
                      placeholder="Leave blank to use default system key"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      If provided, this key will be used instead of the default. 
                      Get a key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 underline">aistudio.google.com</a>.
                    </p>
                  </div>
                </div>
              )}

              {formData.provider === 'openai' && (
                <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input
                      type="text"
                      name="baseUrl"
                      value={formData.openai.baseUrl}
                      onChange={handleChange}
                      placeholder="https://api.openai.com/v1"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      name="apiKey"
                      value={formData.openai.apiKey}
                      onChange={handleChange}
                      placeholder="sk-..."
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.openai.model}
                      onChange={handleChange}
                      placeholder="gpt-4o, llama-3.1-70b, etc."
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button onClick={handleSave} className="w-full sm:w-auto sm:ml-3">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={onClose} className="mt-3 w-full sm:w-auto sm:mt-0">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};