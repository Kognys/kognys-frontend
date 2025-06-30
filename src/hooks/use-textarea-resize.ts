
import { useEffect, useRef } from 'react';

export function useTextareaResize(value: string, minRows: number = 1) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the height based on content
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
    const minHeight = lineHeight * minRows;
    const newHeight = Math.max(textarea.scrollHeight, minHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows]);

  return textareaRef;
}
