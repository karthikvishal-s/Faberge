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

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Punjabi", "Spanish", "Korean", "Japanese"];

  useEffect(() => {
    axios.get("http://localhost:4040/questions").then(res => setQuestions(res.data));
    // Default the language in storage
    localStorage.setItem('quiz_lang', 'English');
  }, []);

  const handleSelect = (option) => {
    const newAnswers = { ...answers, [questions[currentIdx].id]: option };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      // Baton pass to results
      router.push(`/quiz/results?token=${token}&email=${email}`);
    }
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('quiz_lang', newLang);
  };

  if (questions.length === 0) return <div className="bg-black min-h-screen" />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* --- The Language Nutiness --- */}
      <div className="absolute top-10 right-10 flex flex-col items-end">
        <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Vibe Dialect</label>
        <select 
          value={lang} 
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-transparent border border-white/20 text-white px-4 py-2 text-xs uppercase tracking-widest outline-none hover:border-green-500 transition-colors cursor-pointer"
        >
          {languages.map(l => <option key={l} value={l} className="bg-black text-white">{l}</option>)}
        </select>
      </div>

      <p className="text-green-500 mb-4 font-mono text-sm tracking-tighter animate-pulse">
        {lang.toUpperCase()} FREQUENCY // TRIAL {currentIdx + 1}
      </p>

      <h2 className="text-4xl font-black italic mb-12 text-center max-w-2xl leading-tight uppercase">
        {questions[currentIdx].text}
      </h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {questions[currentIdx].options.map(opt => (
          <button 
            key={opt} 
            onClick={() => handleSelect(opt)}
            className="group relative border border-white/10 py-6 px-4 overflow-hidden transition-all hover:border-green-500"
          >
            <span className="relative z-10 font-bold uppercase text-xs tracking-widest group-hover:text-black transition-colors">{opt}</span>
            <div className="absolute inset-0 bg-green-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><QuizContent /></Suspense>; }