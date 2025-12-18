"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lang, setLang] = useState('English');

  const languages = ["English", "Hindi", "Tamil", "Telugu", "Punjabi", "Spanish", "Korean", "Japanese", "French"];

  useEffect(() => {
    axios.get("http://localhost:4040/questions").then(res => setQuestions(res.data));
    localStorage.setItem('quiz_lang', 'English');
  }, []);

  const handleSelect = (option) => {
    const newAnswers = { ...answers, [questions[currentIdx].id]: option };
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      router.push(`/quiz/results?token=${searchParams.get('token')}&email=${searchParams.get('email')}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* LUXURY LANGUAGE SELECTOR */}
      <div className="flex flex-col items-center mb-16 w-full max-w-4xl">
        <span className="text-[9px] uppercase tracking-[0.6em] text-zinc-600 mb-8">Select Alignment</span>
        <div className="flex gap-4 overflow-x-auto no-scrollbar w-full justify-start md:justify-center px-4">
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); localStorage.setItem('quiz_lang', l); }}
              className={`px-8 py-3 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                lang === l ? "bg-green-500 border-green-500 text-black" : "border-white/5 text-zinc-500 hover:border-white/20"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION UI */}
      <div className="w-full max-w-2xl text-center">
        <p className="font-mono text-green-500/50 text-[10px] mb-4 tracking-[0.3em] uppercase">Step {currentIdx + 1} of 5</p>
        <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-tight mb-12">
          {questions[currentIdx]?.text}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questions[currentIdx]?.options.map(opt => (
            <button key={opt} onClick={() => handleSelect(opt)} className="group relative border border-white/5 py-6 px-4 hover:border-green-500/50 transition-all overflow-hidden bg-zinc-900/20 rounded-xl">
              <span className="relative z-10 text-[11px] uppercase tracking-widest font-bold group-hover:text-green-500 transition-colors">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><QuizContent /></Suspense>; }