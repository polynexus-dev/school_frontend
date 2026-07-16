import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) setPosition({ x: 0, y: 0 });
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current) return;
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      });
    };
    const handleMouseUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  const handleMouseDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
      <div
        className="bg-cn-surface rounded-[14px] shadow-[0_8px_24px_rgba(59,7,100,.14),0_2px_6px_rgba(59,7,100,.08)] border border-cn-border p-6 relative max-w-[92vw] w-fit transition-all duration-200"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div
          onMouseDown={handleMouseDown}
          className="flex justify-between items-center mb-4 border-b border-cn-border pb-3 cursor-move select-none"
        >
          <h2 className="font-heading font-semibold text-base text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center text-ink-500 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition duration-150 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-[13.5px] text-ink-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
