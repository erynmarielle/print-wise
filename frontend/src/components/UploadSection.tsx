import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  onSampleLoad?: () => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onUrlSubmit,
  onSampleLoad,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlSubmit(urlInput.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Dropzone Column */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Document Dropzone
            </span>
            <span className="text-[11px] text-slate-400">PDF, PNG, JPG</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] pressable ${
              dragActive
                ? 'border-sky-500 bg-sky-50/60 scale-[0.99]'
                : 'border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-slate-50'
            } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-11 h-11 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center mb-2.5 text-slate-700">
              <UploadCloud className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Drag & drop document here
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              or <span className="text-sky-600 font-semibold underline underline-offset-2">browse computer</span>
            </p>
          </div>
        </div>

        {/* Divider / Link Input Column */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Google Docs or Slides Link
              </span>
              <span className="text-[11px] text-slate-400">Shared Links</span>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              When a customer sends a Google Docs, Slides, or Sheets URL via Messenger, paste it below to extract and quote every page automatically.
            </p>

            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/document/d/... or presentation/d/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !urlInput.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs pressable"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Analyzing Ink Density...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Fetch & Quote Link</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Action Test Helper */}
          {onSampleLoad && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Need to test quoter?</span>
              <button
                type="button"
                onClick={onSampleLoad}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-900 bg-sky-50 hover:bg-sky-100/70 border border-sky-200/80 px-2.5 py-1 rounded-lg transition-all pressable"
              >
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>Load 4-Page Sample Document</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

