import React, { useEffect, useMemo, useRef } from 'react';

export function RemoteGrid({ streams }: { streams: Map<string, MediaStream> }) {
  const entries = useMemo(() => Array.from(streams.entries()), [streams]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {entries.map(([id, stream]) => (
        <RemoteVideo key={id} stream={stream} />
      ))}
      {entries.length === 0 && (
        <div className="w-full aspect-video bg-black/80 rounded-lg flex items-center justify-center text-white">
          <div className="text-center">
            <i className="fas fa-satellite-dish text-5xl mb-3 opacity-50"></i>
            <p>No live stream yet</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return <video ref={ref} className="w-full h-full object-cover rounded-lg bg-black" playsInline />;
}
