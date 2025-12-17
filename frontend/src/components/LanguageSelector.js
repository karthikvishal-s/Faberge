"use client";
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English (Global)', flag: '🌐' },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
];

export default function LanguageSelector({ onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full hover:bg-zinc-800 transition-all"
      >
        <span>{selected.flag}</span>
        <span className="text-sm font-medium">{selected.name}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelected(lang);
                setIsOpen(false);
                onLanguageChange(lang.code);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-green-500 hover:text-black flex items-center justify-between transition-colors"
            >
              <span>{lang.name}</span>
              <span className="opacity-50">{lang.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}