"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';

export default function QuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    axios.get('http://localhost:4040/questions').then(res => setQuestions(res.data));
  }, []);

  const handleSelect = (option) => {
    const newAnswers = { ...answers, [questions[currentIdx].id]: option };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      localStorage.setItem('quiz_lang', language);
      router.push(`/quiz/results?token=${token}`);
    }
  };

  if (!questions.length) return <div className="bg-black min-h-screen" />;

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      {/* Header with Language Selector */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <div className="h-1 flex-1 bg-zinc-800 rounded-full mr-8 overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <LanguageSelector onLanguageChange={setLanguage} />
      </div>

      <div className="max-w-4xl mx-auto mt-20">
        <p className="text-zinc-500 font-mono mb-2">STEP {currentIdx + 1} OF 10</p>
        <h2 className="text-4xl md:text-5xl font-black mb-12 tracking-tight">
          {questions[currentIdx].text}
        </h2>

        {/* 6-Option Aesthetic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions[currentIdx].options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className="group relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-green-500 transition-all duration-300 active:scale-95 shadow-lg overflow-hidden"
            >
              <span className="relative z-10 font-medium group-hover:text-green-400 transition-colors">
                {opt}
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}