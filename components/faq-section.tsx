'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQSectionProps {
  dict: {
    faq: {
      title: string;
      questions: {
        question: string;
        answer: string;
      }[];
    };
  };
}

export function FAQSection({ dict }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-14 xl:py-16 2xl:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-3 sm:mb-4">
            {dict.faq.title}
          </h2>
        </div>

        {/* Accordion - Single Column Centered */}
        <div className="max-w-2xl mx-auto space-y-4">
          {dict.faq.questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-cream rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Question Button */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 lg:p-6 text-left"
                >
                  <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-coral flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[600px]' : 'max-h-0'
                  }`}
                >
                  <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
