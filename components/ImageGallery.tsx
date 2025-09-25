import React from 'react';
import type { Conversation } from '../types';
import { XIcon, DownloadIcon } from './Icons';

interface ImageGalleryProps {
  conversation: Conversation;
  onClose: () => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ conversation, onClose }) => {
  const imageMessages = conversation.messages.filter(m => m.imageUrl);

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    // Sanitize prompt for filename
    const fileName = prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
    link.download = `${fileName || 'generated_image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-theme-surface backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
          <h3 className="text-xl font-semibold text-theme-text">Image Gallery</h3>
          <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close gallery">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {imageMessages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {imageMessages.map(message => (
                <div key={message.id} className="group relative overflow-hidden rounded-3xl bg-gray-200 border border-black/10 aspect-square">
                  <img src={message.imageUrl} alt={message.content} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
                    <p className="text-sm text-white line-clamp-2">{message.content}</p>
                    <button
                      onClick={() => handleDownload(message.imageUrl!, message.content)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Download image"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-theme-text-secondary">
              <p className="text-lg">No images generated yet.</p>
              <p className="text-sm mt-2">Use the tools menu to generate an image.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};