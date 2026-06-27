import { useState } from 'react';

export default function Tooltip({ children, text, position = 'right' }) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}