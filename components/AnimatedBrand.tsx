"use client"

import { useState, useEffect } from "react";

export default function AnimatedBrand() {

  const [index, setIndex] = useState(0);
  
  const sequence = [
    { text: "Create", color: "text-orange-500", suffix: " Your Exam" },
    { text: "Test", color: "text-green-500", suffix: " Your Exam" },
    { text: "Win", color: "text-blue-500", suffix: " Your Exam" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % sequence.length);
    }, 2000); // 2 seconds per cycle
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-2xl font-semibold tracking-tight transition-all duration-500 ease-in-out">
      <span className={`${sequence[index].color} transition-colors duration-500`}>
        {sequence[index].text}
      </span>
      {sequence[index].suffix}
    </span>
  );
};