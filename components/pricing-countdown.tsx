'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  targetHour?: number; // Hour to reset (default: 0 = midnight)
  className?: string;
}

export function PricingCountdown({ targetHour = 0, className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);
      
      // If target time has passed today, set for tomorrow
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetHour]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono font-semibold tabular-nums">
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

interface LimitedSlotsProps {
  min?: number;
  max?: number;
  className?: string;
}

export function LimitedSlots({ min = 23, max = 50, className = '' }: LimitedSlotsProps) {
  const [slots, setSlots] = useState<number>(min);

  useEffect(() => {
    // Generate a random number of slots between min and max
    const randomSlots = Math.floor(Math.random() * (max - min + 1)) + min;
    setSlots(randomSlots);

    // Update every 5 minutes to simulate "real-time" changes
    const interval = setInterval(() => {
      const newSlots = Math.floor(Math.random() * (max - min + 1)) + min;
      setSlots(newSlots);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [min, max]);

  return (
    <span className={`font-semibold ${className}`}>
      {slots}
    </span>
  );
}
