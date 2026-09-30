import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, Loader2, Sparkles } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onUrlSubmit,
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Drag & Drop Zone */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Option 1: Upload Document
          </h2>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
            } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drag & drop your PDF or image here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, PNG, JPG (Messenger downloads)
            </p>
          </div>
        </div>

        {/* Right: Google Docs / Slides Link */}
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Option 2: Paste Google Docs or Slides Link
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              When customers send a Google Docs or Google Slides link in Messenger, paste it here.
              We'll automatically extract and analyze every page.
            </p>

            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/document/d/... or presentation/d/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Document...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Analyze Google Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Fast sub-second CMYK analysis
            </span>
            <span>Make sure Google Drive link is viewable</span>
          </div>
        </div>
      </div>
    </div>
  );
};
