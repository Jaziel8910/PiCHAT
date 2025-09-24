import React from 'react';
import { LoadingIcon } from './Icons';

export const DeepThinkingIndicator: React.FC = () => {
    return (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 bg-[length:200%_auto] animate-gradient text-white shadow-lg max-w-md my-2">
            <div className="flex items-center gap-3 mb-2">
                <LoadingIcon className="w-5 h-5" />
                <h4 className="font-semibold">Deep Work in Progress</h4>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
                Performing deep analysis for a comprehensive response. This may take a moment. You can safely switch tabs; the process will continue in the background.
            </p>
        </div>
    );
};