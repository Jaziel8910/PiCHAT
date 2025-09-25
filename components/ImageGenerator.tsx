import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ImageGenerationModel, GenerateImageOptions } from '../types';
import { usePuter } from '../hooks/usePuter';
import { XIcon, ImageIcon, LoadingIcon, RegenerateIcon } from './Icons';

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToChat: (prompt: string, imageUrl: string) => void;
}

const IMAGE_MODELS: { id: ImageGenerationModel, name: string, description: string }[] = [
    { id: 'gpt-image-1', name: 'GPT Image 1', description: 'Better creativity and quality for new images.' },
    { id: 'openrouter:google/gemini-2.5-flash-image-preview', name: 'Nano Banana', description: 'Faster results and ideal for editing existing images.' },
];

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType });
        };
        reader.onerror = error => reject(error);
    });
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ isOpen, onClose, onAddToChat }) => {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<ImageGenerationModel>('gpt-image-1');
    const [inputImageFile, setInputImageFile] = useState<{ file: File, dataUrl: string } | null>(null);
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<string | null>(null);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { generateImage } = usePuter();

    useEffect(() => {
      // If switching to a text-to-image model, clear the input image.
      if (model === 'gpt-image-1') {
        setInputImageFile(null);
      }
    }, [model]);

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        if (model === 'openrouter:google/gemini-2.5-flash-image-preview' && !inputImageFile) {
            setError('Please upload an image for image-to-image generation.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setIsEditing(false);

        try {
            const options: GenerateImageOptions = { prompt, model };
            if (model === 'openrouter:google/gemini-2.5-flash-image-preview' && inputImageFile) {
                const { base64, mimeType } = await fileToBase64(inputImageFile.file);
                options.input_image = base64;
                options.input_image_mime_type = mimeType;
            }
            const imageUrl = await generateImage(options);
            setGeneratedImage(imageUrl);
            setOriginalImage(imageUrl);
            setIsEditing(true);
            setEditPrompt('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyEdit = async () => {
        if (!editPrompt || !originalImage) {
            setError('Please enter an editing instruction.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Fetch original image as blob to get its base64 data
            const response = await fetch(originalImage);
            const blob = await response.blob();
            const { base64, mimeType } = await fileToBase64(new File([blob], "original.png", { type: blob.type }));

            const options: GenerateImageOptions = {
                prompt: editPrompt,
                model: 'openrouter:google/gemini-2.5-flash-image-preview', // Always use Nano Banana for editing
                input_image: base64,
                input_image_mime_type: mimeType
            };
            const imageUrl = await generateImage(options);
            setGeneratedImage(imageUrl);
        } catch (err: any) {
            setError(err.message || 'An error occurred during image editing.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const dataUrl = URL.createObjectURL(file);
            setInputImageFile({ file, dataUrl });
            setModel('openrouter:google/gemini-2.5-flash-image-preview');
        }
    };

    const handleAddToChatAndClose = () => {
        if (generatedImage) {
            const finalPrompt = isEditing ? `${prompt} (edited: ${editPrompt})` : prompt;
            onAddToChat(finalPrompt, generatedImage);
            onClose();
        }
    };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
        <div className="bg-theme-surface backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-puter-blue" />
                    <h2 className="text-xl font-bold text-theme-text">Image Generation Studio</h2>
                </div>
                <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-1/3 border-r border-black/10 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent resize-y" placeholder="A futuristic cityscape at sunset..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Model</label>
                        <div className="space-y-2">
                          {IMAGE_MODELS.map(m => (
                            <label key={m.id} className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition-all ${model === m.id ? 'border-puter-blue bg-blue-500/5' : 'border-transparent bg-black/5 hover:bg-black/10'}`}>
                              <div className="flex items-center">
                                <input type="radio" value={m.id} checked={model === m.id} onChange={(e) => setModel(e.target.value as ImageGenerationModel)} className="w-4 h-4 text-puter-blue focus:ring-puter-blue mr-3"/>
                                <span className="font-semibold">{m.name}</span>
                              </div>
                              <p className="text-xs text-theme-text-secondary mt-1 pl-7">{m.description}</p>
                            </label>
                          ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Input Image (Optional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-theme-border border-dashed rounded-2xl">
                            <div className="space-y-1 text-center">
                                {inputImageFile ? (
                                    <img src={inputImageFile.dataUrl} alt="Input preview" className="mx-auto h-24 w-auto rounded-lg" />
                                ) : (
                                    <ImageIcon className="mx-auto h-12 w-12 text-theme-text-secondary" />
                                )}
                                <div className="flex text-sm text-theme-text-secondary">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-black/5 rounded-md font-medium text-puter-blue hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-puter-blue px-1">
                                        <span>{inputImageFile ? "Change image" : "Upload an image"}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/webp" />
                                    </label>
                                </div>
                                <p className="text-xs text-theme-text-secondary">PNG, JPG, WEBP. Uploading an image will switch to Nano Banana model.</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex-1" />
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:bg-gray-400 disabled:shadow-none">
                        {isLoading && !isEditing ? <LoadingIcon className="w-5 h-5"/> : <ImageIcon className="w-5 h-5" />}
                        {isLoading && !isEditing ? 'Generating...' : 'Generate Image'}
                    </button>
                </aside>
                <main className="flex-1 p-6 flex flex-col items-center justify-center bg-black/5">
                    {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-2xl max-w-md">{error}</div>}
                    {generatedImage ? (
                        <div className="w-full h-full flex flex-col items-center justify-start gap-4">
                            <div className="relative w-full flex-1 flex items-center justify-center">
                                {isLoading && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl"><LoadingIcon className="w-12 h-12 text-white" /></div>}
                                <img src={generatedImage} alt={prompt} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"/>
                            </div>
                           {isEditing && (
                             <div className="w-full max-w-lg p-4 bg-theme-surface rounded-2xl shadow-lg border border-theme-border space-y-3">
                                <p className="text-sm font-semibold text-theme-text">Edit your image with Nano Banana</p>
                                <div className="flex gap-2">
                                  <input value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g., add a cat on the roof" className="flex-1 bg-black/5 text-theme-text rounded-lg p-2 text-sm focus:ring-1 focus:ring-puter-blue"/>
                                  <button onClick={handleApplyEdit} disabled={isLoading} className="px-3 py-1 bg-puter-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-600">Apply</button>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <button onClick={() => setEditPrompt("Change the background to ")} className="px-2 py-1 bg-black/10 rounded-md hover:bg-black/20">Change BG</button>
                                    <button onClick={() => setEditPrompt("Add an object: ")} className="px-2 py-1 bg-black/10 rounded-md hover:bg-black/20">Add Object</button>
                                    <button onClick={() => setEditPrompt("Apply a vintage filter")} className="px-2 py-1 bg-black/10 rounded-md hover:bg-black/20">Filter</button>
                                    <button onClick={() => setGeneratedImage(originalImage)} className="ml-auto px-2 py-1 bg-black/10 rounded-md hover:bg-black/20" title="Reset to original"><RegenerateIcon className="w-4 h-4"/></button>
                                </div>
                             </div>
                           )}
                           <button onClick={handleAddToChatAndClose} className="px-4 py-2 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors font-semibold">
                                Add to Chat
                            </button>
                        </div>
                    ) : (
                         <div className="text-center text-theme-text-secondary">
                             {!isLoading && (
                                <>
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold">Your generated image will appear here</h3>
                                    <p className="text-sm">Fill out the details on the left and click "Generate".</p>
                                </>
                             )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    </div>
  )
}