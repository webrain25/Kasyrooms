import React, { useEffect, useRef } from 'react';

export function LocalPreview({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      ref.current.muted = true;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return <video ref={ref} className="w-full h-full object-cover rounded-lg bg-black" playsInline muted />;
}
