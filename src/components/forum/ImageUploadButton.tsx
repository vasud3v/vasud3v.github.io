import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadButtonProps {
  onImageInsert: (markdownImage: string) => void;
  className?: string;
  iconSize?: number;
}

export default function ImageUploadButton({
  onImageInsert,
  className = 'transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink',
  iconSize = 14,
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    // Convert to data URL for local preview (no backend needed)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      onImageInsert(`\n![${altText}](${dataUrl})\n`);
      setIsUploading(false);
      setShowDropdown(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInsert = () => {
    if (!urlInput.trim()) return;
    onImageInsert(`\n![image](${urlInput.trim()})\n`);
    setUrlInput('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={className}
        title="Insert Image"
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          <ImageIcon size={iconSize} />
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 hud-panel w-[280px] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider">
                Insert Image
              </span>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-forum-muted hover:text-forum-text transition-forum"
              >
                <X size={12} />
              </button>
            </div>

            {/* Upload from file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="transition-forum w-full flex items-center gap-2 rounded-md border border-dashed border-forum-border/50 bg-forum-bg/50 px-3 py-3 text-[10px] font-mono text-forum-muted hover:border-forum-pink/40 hover:text-forum-pink hover:bg-forum-pink/[0.03] group"
            >
              <Upload size={14} className="text-forum-muted group-hover:text-forum-pink transition-forum" />
              <div className="text-left">
                <div className="font-semibold">Upload from device</div>
                <div className="text-[8px] text-forum-muted/60">PNG, JPG, GIF, WebP · Max 5MB</div>
              </div>
            </button>

            {/* Insert from URL */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-forum-muted">
                Or paste image URL
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
                  placeholder="https://example.com/image.png"
                  className="flex-1 rounded border border-forum-border/40 bg-forum-bg px-2.5 py-1.5 text-[10px] font-mono text-forum-text placeholder:text-forum-muted/40 outline-none focus:border-forum-pink/40 focus:ring-1 focus:ring-forum-pink/20 transition-forum"
                />
                <button
                  onClick={handleUrlInsert}
                  disabled={!urlInput.trim()}
                  className="transition-forum rounded bg-forum-pink/15 border border-forum-pink/30 px-2.5 py-1.5 text-[9px] font-mono font-semibold text-forum-pink hover:bg-forum-pink/25 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
