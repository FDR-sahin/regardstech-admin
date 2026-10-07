import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';

interface ImageUploadOrUrlProps {
  value: string;
  onChange: (urlOrDataUrl: string) => void;
  label?: string;
  helperText?: string;
  presets?: { label: string; url: string }[];
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  className?: string;
}

export const ImageUploadOrUrl: React.FC<ImageUploadOrUrlProps> = ({
  value,
  onChange,
  label = 'Image',
  helperText = 'Paste a remote web URL (https://) or directly upload an image from your computer.',
  presets = [],
  aspectRatio = 'video',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read local file. Please try again.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (val: string) => {
    setErrorMsg(null);
    const trimmed = val.trim();
    // Check if user accidentally pasted local path like C:\, D:\, /Users/, file:///
    if (
      trimmed.startsWith('file:///') ||
      /^[a-zA-Z]:[\\\/]/.test(trimmed) ||
      trimmed.startsWith('/Users/') ||
      trimmed.startsWith('/home/') ||
      trimmed.startsWith('\\\\')
    ) {
      setErrorMsg('Notice: Browsers cannot access local computer file paths directly (e.g. C:\\...). Please switch to the "Upload from PC" tab above to choose your file directly from your computer!');
      setActiveTab('upload');
      return;
    }
    onChange(val);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isLocalDataUri = value && value.startsWith('data:image/');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and mode switch */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>

        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Web URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload from PC</span>
          </button>
        </div>
      </div>

      {/* Tab: URL Input */}
      {activeTab === 'url' ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={isLocalDataUri ? '' : value}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            {value && !isLocalDataUri && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isLocalDataUri && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Currently using uploaded image from local PC. Paste a URL to override.
            </p>
          )}

          {/* Quick presets */}
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab: Upload from Local PC */
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-900/50'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs py-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Processing local image…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-0.5">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-white">
                  Click to select from your Computer, or drag & drop
                </div>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, WEBP, or SVG (Up to 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="text-[11px] text-rose-400 flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview */}
      {value && (
        <div className="mt-2.5 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
          <div
            className={`relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 ${
              aspectRatio === 'square'
                ? 'w-16 h-16'
                : aspectRatio === 'wide'
                ? 'w-24 h-12'
                : 'w-20 h-14'
            }`}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback icon on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <div className="font-semibold text-white truncate flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{isLocalDataUri ? 'Local Uploaded File' : 'External Web Image'}</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {isLocalDataUri ? 'Stored as Data URL (Works offline & online)' : value}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
    </div>
  );
};
