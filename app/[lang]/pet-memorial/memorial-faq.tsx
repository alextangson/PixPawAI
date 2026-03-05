'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MemorialFAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function MemorialFAQ({ faqs }: MemorialFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="bg-white rounded-xl overflow-hidden border border-stone-100"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
            >
              <span className="text-sm sm:text-base font-medium text-stone-700 pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-[600px]' : 'max-h-0'
              }`}
            >
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-stone-500 leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
