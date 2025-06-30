
import { useState, useEffect } from 'react';

const DynamicText = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const texts = [
    "AI Researchers",
    "Blockchain Developers",
    "Crypto Enthusiasts",
    "Knowledge Seekers",
    "Innovation Leaders",
    "Tech Pioneers"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className={`text-primary font-bold transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
      {texts[currentIndex]}
    </span>
  );
};

export default DynamicText;
