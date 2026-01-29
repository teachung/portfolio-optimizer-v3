
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4700);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
  };

  const colors = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-sky-600/90 border-sky-500',
    warning: 'bg-yellow-600/90 border-yellow-500',
  };

  return (
    <div
      className={`flex items-start p-4 mb-4 text-white rounded-lg shadow-lg backdrop-blur-sm border-l-4 transition-all duration-300 ${colors[type]} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <i className={`fas ${icons[type]} mr-3 text-xl`}></i>
      <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: message }} />
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
      >
        <span className="sr-only">Close</span>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
