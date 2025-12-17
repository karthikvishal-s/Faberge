"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function Quiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Gets the token from the URL after Spotify login

  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch questions from your Flask backend (Port 4040)
    axios.get('http://localhost:4040/questions')
      .then(res => {
        setQuestions(res.data);
        setLoading(false);
      });
  }, []);

  // THE MISSING FUNCTION
  const submitQuiz = async (finalAnswers) => {
    setLoading(true);
    try {
      // Save answers to localStorage so the Results page can read them
      localStorage.setItem('vibe_answers', JSON.stringify(finalAnswers));
      
      // Navigate to the results page with the token
      router.push(`/quiz/results?token=${token}`);
    } catch (err) {
        console.error("Submission failed", err);
        alert("Failed to process your vibe. Try again!");
        setLoading(false);
    }
  };

  const handleAnswer = (val) => {
    const currentQ = questions[step];
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // We've reached the end! Submit.
      submitQuiz(newAnswers);
    }
  };

  if (loading) return (
    <div className="bg-black text-white h-screen flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold tracking-widest animate-pulse">ANALYZING YOUR VIBE...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-1 mb-12 rounded-full overflow-hidden">
            <motion.div 
                className="bg-green-500 h-1" 
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <span className="text-green-500 font-mono text-sm mb-2 block">QUESTION {step + 1} OF {questions.length}</span>
            <h2 className="text-4xl font-black mb-12 tracking-tight">{questions[step].text}</h2>
            
            <div className="flex flex-col gap-6">
               <input 
                 type="range" min="1" max="10" defaultValue="5"
                 className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                 onMouseUp={(e) => handleAnswer(e.target.value)} // Submits when user lets go
                 onTouchEnd={(e) => handleAnswer(e.target.value)}
               />
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span>{questions[step].min}</span>
                  <span>{questions[step].max}</span>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}