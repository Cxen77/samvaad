import React, { useState } from 'react';
import { HiBold, HiItalic, HiLink, HiCodeBracket, HiListBullet, HiPhoto } from 'react-icons/hi2';

const RichTextEditor = ({ value, onChange, placeholder, minHeight = 'min-h-[150px]' }) => {
    const insertFormat = (startTag, endTag) => {
        const textarea = document.getElementById('rich-textarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newValue = `${before}${startTag}${selection}${endTag}${after}`;
        onChange(newValue);

        // Restore selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + startTag.length, end + startTag.length);
        }, 0);
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                <button
                    type="button"
                    onClick={() => insertFormat('**', '**')}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                    title="Bold"
                >
                    <HiBold className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={() => insertFormat('*', '*')}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                    title="Italic"
                >
                    <HiItalic className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                    type="button"
                    onClick={() => insertFormat('[', '](url)')}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                    title="Link"
                >
                    <HiLink className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={() => insertFormat('`', '`')}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                    title="Code"
                >
                    <HiCodeBracket className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={() => insertFormat('- ', '')}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                    title="List"
                >
                    <HiListBullet className="w-5 h-5" />
                </button>
            </div>

            {/* Textarea */}
            <textarea
                id="rich-textarea"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full p-4 bg-transparent border-none focus:ring-0 resize-y text-gray-700 placeholder-gray-400 ${minHeight}`}
            />

            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                <span>Markdown supported</span>
                <span>{value.length} chars</span>
            </div>
        </div>
    );
};

export default RichTextEditor;
