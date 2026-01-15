'use client';

import { useState } from 'react';
import { X, Upload, ChevronDown, ChevronUp, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: {
    upload: {
      title: string;
      subtitle: string;
      primaryLabel: string;
      optionalTitle: string;
      optionalSubtitle: string;
      goodVsBad: {
        title: string;
        good: string[];
        bad: string[];
      };
      buttons: {
        cancel: string;
        generate: string;
      };
    };
  };
  selectedStyle?: string | null;
}

export function UploadModal({ isOpen, onClose, dict, selectedStyle }: UploadModalProps) {
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const [showOptional, setShowOptional] = useState(false);

  if (!isOpen) return null;

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainPhoto(e.target.files[0]);
    }
  };

  const handleExtraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 2);
      setExtraPhotos(files);
    }
  };

  const handleGenerate = () => {
    // TODO: Implement API call with mainPhoto and optional extraPhotos
    console.log('Generating with:', { mainPhoto, extraPhotos });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{dict.upload.title}</h2>
            <p className="text-sm text-gray-600">
              {selectedStyle ? (
                <span>
                  {dict.upload.subtitle}{' '}
                  <span className="inline-flex items-center gap-1 bg-coral/10 text-coral px-2 py-0.5 rounded-full text-xs font-semibold ml-1">
                    <Sparkles className="w-3 h-3" />
                    {selectedStyle}
                  </span>
                </span>
              ) : (
                dict.upload.subtitle
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {dict.upload.primaryLabel}
            </label>
            <div
              className={`relative border-2 border-dashed ${
                mainPhoto ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
              } rounded-2xl p-8 hover:border-coral hover:bg-coral/5 transition-all cursor-pointer`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleMainUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {mainPhoto ? (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">{mainPhoto.name}</p>
                  <p className="text-sm text-gray-600">Ready to generate!</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-1">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-sm text-gray-600">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Extra Photos */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowOptional(!showOptional)}
              className="w-full flex items-center justify-between text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">{dict.upload.optionalTitle}</p>
                <p className="text-sm text-gray-600">{dict.upload.optionalSubtitle}</p>
              </div>
              {showOptional ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showOptional && (
              <div className="mt-4 border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraUpload}
                  className="absolute opacity-0 pointer-events-none"
                  id="extra-upload"
                />
                <label
                  htmlFor="extra-upload"
                  className="block text-center cursor-pointer"
                >
                  {extraPhotos.length > 0 ? (
                    <div>
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-900">
                        {extraPhotos.length} extra photo(s) added
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Add 1-2 extra angles (Optional)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Good vs Bad Guide */}
          <div className="bg-gradient-to-br from-orange-50 to-coral/10 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-coral">💡</span>
              {dict.upload.goodVsBad.title}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Good Examples */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="font-semibold text-green-700">Good</p>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {dict.upload.goodVsBad.good.map((item, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Bad Examples */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="font-semibold text-red-700">Avoid</p>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {dict.upload.goodVsBad.bad.map((item, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-3xl">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300"
          >
            {dict.upload.buttons.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!mainPhoto}
            className="flex-1 bg-coral hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dict.upload.buttons.generate}
          </Button>
        </div>
      </div>
    </div>
  );
}
