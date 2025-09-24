import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ImageGenerationModel, GenerateImageOptions } from '../types';
import { usePuter } from '../hooks/usePuter';
// fix: Removed unused and non-existent UploadIcon import.
import { XIcon, ImageIcon, LoadingIcon } from './Icons';

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToChat: (prompt: string, imageUrl: string) => void;
}

const IMAGE_MODELS: { id: ImageGenerationModel, name: string }[] = [
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'gpt-image-1', name: 'GPT Image 1' },
    { id: 'gemini-2.5-flash-image-preview', name: 'Nano Banana (Image-to-Image)' },
];

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ isOpen, onClose, onAddToChat }) => {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<ImageGenerationModel>('dall-e-3');
    const [quality, setQuality] = useState<'standard' | 'hd' | 'low' | 'medium' | 'high'>('standard');
    const [inputImage, setInputImage] = useState<{ file: File, dataUrl: string } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { generateImage } = usePuter();

    const qualityOptions = useMemo(() => {
        if (model === 'dall-e-3') return [{id: 'standard', name: 'Standard'}, {id: 'hd', name: 'HD'}];
        if (model === 'gpt-image-1') return [{id: 'low', name: 'Low'}, {id: 'medium', name: 'Medium'}, {id: 'high', name: 'High'}];
        return [];
    }, [model]);

    useEffect(() => {
        if (model === 'dall-e-3') setQuality('standard');
        else if (model === 'gpt-image-1') setQuality('medium');
    }, [model]);

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        if (model === 'gemini-2.5-flash-image-preview' && !inputImage) {
            setError('Please upload an image for image-to-image generation.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const options: GenerateImageOptions = { prompt, model };
            if (qualityOptions.length > 0) {
                options.quality = quality;
            }
            if (model === 'gemini-2.5-flash-image-preview' && inputImage) {
                const base64String = await fileToBase64(inputImage.file);
                options.input_image = base64String.split(',')[1];
                options.input_image_mime_type = inputImage.file.type;
            }
            const imageUrl = await generateImage(options);
            setGeneratedImage(imageUrl);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const dataUrl = URL.createObjectURL(file);
            setInputImage({ file, dataUrl });
        }
    };

    const handleAddToChatAndClose = () => {
        if (generatedImage) {
            onAddToChat(prompt, generatedImage);
            onClose();
        }
    };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
        <div className="bg-theme-surface/90 backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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
                <aside className="w-1/3 border-r border-black/10 p-6 flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent resize-y" placeholder="A futuristic cityscape at sunset..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Model</label>
                        <select value={model} onChange={e => setModel(e.target.value as ImageGenerationModel)} className="w-full appearance-none bg-black/5 text-theme-text rounded-2xl p-2.5 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent">
                            {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    {qualityOptions.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-theme-text mb-1">Quality</label>
                            <select value={quality} onChange={e => setQuality(e.target.value as any)} className="w-full appearance-none bg-black/5 text-theme-text rounded-2xl p-2.5 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent">
                               {qualityOptions.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                            </select>
                        </div>
                    )}
                    {model === 'gemini-2.5-flash-image-preview' && (
                        <div>
                            <label className="block text-sm font-medium text-theme-text mb-1">Input Image</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-theme-border border-dashed rounded-2xl">
                                <div className="space-y-1 text-center">
                                    {inputImage ? (
                                        <img src={inputImage.dataUrl} alt="Input preview" className="mx-auto h-24 w-auto rounded-lg" />
                                    ) : (
                                        <ImageIcon className="mx-auto h-12 w-12 text-theme-text-secondary" />
                                    )}
                                    <div className="flex text-sm text-theme-text-secondary">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-black/5 rounded-md font-medium text-puter-blue hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-puter-blue px-1">
                                            <span>{inputImage ? "Change image" : "Upload an image"}</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/webp" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-theme-text-secondary">PNG, JPG, WEBP</p>
                                </div>
                            </div>
                        </div>
                    )}
                     <div className="flex-1" />
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:bg-gray-400 disabled:shadow-none">
                        {isLoading ? <LoadingIcon className="w-5 h-5"/> : <ImageIcon className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </aside>
                <main className="flex-1 p-6 flex flex-col items-center justify-center bg-black/5">
                    {isLoading && (
                        <div className="text-center">
                            <LoadingIcon className="w-12 h-12 text-puter-blue" />
                            <p className="mt-4 text-theme-text-secondary">Generating your masterpiece...</p>
                        </div>
                    )}
                    {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-2xl">{error}</div>}
                    {generatedImage && !isLoading && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <img src={generatedImage} alt={prompt} className="max-w-full max-h-[80%] object-contain rounded-2xl shadow-2xl"/>
                            <button onClick={handleAddToChatAndClose} className="px-4 py-2 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors">
                                Add to Chat
                            </button>
                        </div>
                    )}
                    {!generatedImage && !isLoading && !error && (
                        <div className="text-center text-theme-text-secondary">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Your generated image will appear here</h3>
                            <p className="text-sm">Fill out the details on the left and click "Generate".</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    </div>
  )
}