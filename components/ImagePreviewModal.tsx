import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Kattalashtirilgan rasm" className="w-full h-full object-contain rounded-lg" />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-800 p-2 rounded-full text-white hover:bg-gray-700 transition-colors"
          aria-label="Yopish"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};