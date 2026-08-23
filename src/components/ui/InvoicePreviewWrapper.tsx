import React, { useRef, useState, useEffect } from 'react';

interface InvoicePreviewWrapperProps {
  children: React.ReactNode;
}

export const InvoicePreviewWrapper: React.FC<InvoicePreviewWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | string>('auto');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const parentWidth = container.clientWidth;
      const targetWidth = 794; // Standard A4 width in px at 96 DPI
      const targetHeight = 1123; // Standard A4 height in px (ratio 1.414)
      
      if (parentWidth < targetWidth && parentWidth > 0) {
        const newScale = parentWidth / targetWidth;
        setScale(newScale);
        setHeight(targetHeight * newScale);
      } else {
        setScale(1);
        setHeight('auto');
      }
    };

    // Initial measure
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center items-start overflow-hidden bg-slate-50 p-2 sm:p-4 rounded"
      style={{ height: height !== 'auto' ? `${height}px` : 'auto' }}
    >
      <div 
        style={{
          width: '794px',
          minWidth: '794px',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="shadow-xl rounded-2xl overflow-hidden bg-white"
      >
        {children}
      </div>
    </div>
  );
};

export default InvoicePreviewWrapper;
