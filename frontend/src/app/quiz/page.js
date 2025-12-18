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

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Fetch questions from Backend
  useEffect(() => {
    axios.get("http://localhost:4040/questions").then(res => setQuestions(res.data));
  }, []);

  const handleSelect = (option) => {
    const newAnswers = { ...answers, [questions[currentIdx].id]: option };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // 1. Save answers locally
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      // 2. Pass the baton to Results page
      router.push(`/quiz/results?token=${token}&email=${email}`);
    }
  };

  if (questions.length === 0) return <div className="bg-black min-h-screen" />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <p className="text-zinc-500 mb-4 font-mono">STEP {currentIdx + 1} / 10</p>
      <h2 className="text-3xl font-bold mb-8 text-center">{questions[currentIdx].text}</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {questions[currentIdx].options.map(opt => (
          <button 
            key={opt} 
            onClick={() => handleSelect(opt)}
            className="border border-white/20 py-4 hover:bg-white hover:text-black transition-all font-medium uppercase text-xs tracking-widest"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><QuizContent /></Suspense>; }