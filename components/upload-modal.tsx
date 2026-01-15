'use client';

import { useState, useEffect } from 'react';
import { X, Upload, ChevronDown, ChevronUp, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadUserImage } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/client';

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

// 可用的风格列表
const AVAILABLE_STYLES = [
  { id: 'watercolor', name: 'Watercolor', emoji: '🎨' },
  { id: 'oil-painting', name: 'Oil Painting', emoji: '🖼️' },
  { id: 'anime', name: 'Anime', emoji: '🌸' },
  { id: 'cartoon', name: 'Cartoon', emoji: '🎪' },
  { id: '3d-render', name: '3D Render', emoji: '🎬' },
  { id: 'surreal', name: 'Surreal', emoji: '🌀' },
  { id: 'pop-art', name: 'Pop Art', emoji: '🎨' },
  { id: 'sketch', name: 'Sketch', emoji: '✏️' },
];

export function UploadModal({ isOpen, onClose, dict, selectedStyle: initialStyle }: UploadModalProps) {
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(initialStyle || null);

  // 当 initialStyle 改变时更新 selectedStyle
  useEffect(() => {
    if (initialStyle) {
      setSelectedStyle(initialStyle);
    }
  }, [initialStyle]);

  if (!isOpen) return null;

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainPhoto(e.target.files[0]);
      setError('');
    }
  };

  const handleExtraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 2);
      setExtraPhotos(files);
    }
  };

  const handleGenerate = async () => {
    if (!mainPhoto) {
      setError('Please upload a photo');
      return;
    }

    if (!selectedStyle) {
      setError('Please select a style');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress('Uploading your photo...');

    try {
      // 1. 获取用户信息
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to generate images');
        setIsGenerating(false);
        return;
      }

      // 2. 上传图片到 Supabase Storage
      const uploadResult = await uploadUserImage(mainPhoto, user.id);

      if ('error' in uploadResult) {
        throw new Error(uploadResult.error);
      }

      setProgress('Creating your AI portrait...');

      // 3. 调用生成 API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadResult.url,
          style: selectedStyle,
          petType: 'pet', // 可以根据需要自定义
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient credits. Please purchase more credits.');
        }
        throw new Error(result.error || 'Generation failed');
      }

      // 4. 显示结果
      setProgress('Done! 🎉');
      setGeneratedImageUrl(result.outputUrl);
      setRemainingCredits(result.remainingCredits);

      // 延迟后关闭或显示结果
      setTimeout(() => {
        // 可以导航到结果页面或刷新页面
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setMainPhoto(null);
      setExtraPhotos([]);
      setError('');
      setProgress('');
      setGeneratedImageUrl('');
      // 只有在没有预选风格时才重置（如果有预选风格，保持预选）
      if (!initialStyle) {
        setSelectedStyle(null);
      }
      onClose();
    }
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
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Progress / Error / Success Display */}
        {(isGenerating || error || generatedImageUrl) && (
          <div className="px-6 pt-6">
            {/* Progress */}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900">{progress}</p>
                    <p className="text-sm text-blue-700">This may take 10-30 seconds...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isGenerating && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Generation Failed</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success */}
            {generatedImageUrl && !isGenerating && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Success! 🎉</p>
                    <p className="text-sm text-green-700 mb-4">
                      Your portrait is ready! Remaining credits: {remainingCredits}
                    </p>
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated portrait" 
                      className="rounded-xl w-full max-w-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Style Selection - Only show if no style pre-selected */}
          {!initialStyle && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                1. Choose Your Style
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedStyle === style.id
                        ? 'border-coral bg-coral/10 shadow-md'
                        : 'border-gray-200 hover:border-coral/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{style.emoji}</div>
                    <div className="text-xs font-medium text-gray-900">{style.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {initialStyle ? '1. ' : '2. '}{dict.upload.primaryLabel}
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
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1 border-gray-300"
          >
            {dict.upload.buttons.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!mainPhoto || isGenerating || !selectedStyle}
            className="flex-1 bg-coral hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              dict.upload.buttons.generate
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
