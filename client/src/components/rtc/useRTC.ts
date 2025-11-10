import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PeerRole = 'user'|'model'|'admin';

export function useRTC(roomId: string, role: PeerRole = 'user') {
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<Array<{ id: string; role: PeerRole }>>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerIdRef = useRef<string>('');
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const roomIdRef = useRef<string>(roomId);

  const wsUrl = useMemo(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/ws/rooms`;
  }, []);

  // fetch ICE servers
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/rtc/config');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.iceServers)) iceServersRef.current = data.iceServers;
        }
      } catch {}
    })();
  }, []);

  const ensureWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return wsRef.current;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    const lastPongRef = { ts: Date.now() };
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'ping', t: Date.now() })); } catch {}
      }
      if (Date.now() - lastPongRef.ts > 15000) { try { ws.close(); } catch {} }
    }, 5000);
    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', roomId: roomIdRef.current, role }));
    };
    ws.onclose = () => {
      setConnected(false);
      clearInterval(heartbeat);
      // exponential backoff reconnect attempts
      let attempt = 0;
      const retry = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
        attempt++;
        const delay = Math.min(10000, 500 * Math.pow(2, attempt));
        setTimeout(() => { ensureWs(); }, delay);
      };
      retry();
    };
    ws.onmessage = async (ev) => {
      let msg: any; try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.type === 'pong') { lastPongRef.ts = Date.now(); return; }
      if (msg.type === 'peers') { setPeers(msg.peers || []); }
      if (msg.type === 'join') {
        setPeers((prev) => [...prev.filter(p => p.id !== msg.peerId), { id: msg.peerId, role: msg.role || 'user' }]);
      }
      if (msg.type === 'leave') {
        const id = String(msg.peerId);
        setPeers((prev) => prev.filter(p => p.id !== id));
        const pc = pcsRef.current.get(id); if (pc) pc.close();
        pcsRef.current.delete(id);
        setRemoteStreams((m) => { const n = new Map(m); n.delete(id); return n; });
      }
      if (msg.type === 'signal') {
        const from = String(msg.from);
        const data = msg.data;
        if (data?.sdp) {
          let pc = pcsRef.current.get(from);
          if (!pc) pc = await createPeer(from, false);
          await pc!.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === 'offer') {
            const answer = await pc!.createAnswer();
            await pc!.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'signal', to: from, from: peerIdRef.current, data: { sdp: pc!.localDescription } }));
          }
        } else if (data?.candidate) {
          const pc = pcsRef.current.get(from);
          if (pc) { try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {} }
        }
        if (data?.restart) {
          const pc = pcsRef.current.get(from);
          if (pc) {
            try {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'signal', to: from, from: peerIdRef.current, data: { sdp: pc.localDescription } }));
            } catch {}
          }
        }
      }
    };
    return ws;
  }, [roomId, role, wsUrl]);

  // Keep ref in sync with prop
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  async function createPeer(id: string, isInitiator: boolean) {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcsRef.current.set(id, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(JSON.stringify({ type: 'signal', to: id, from: peerIdRef.current, data: { candidate: e.candidate } }));
      }
    };

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) setRemoteStreams((m) => { const n = new Map(m); n.set(id, stream); return n; });
    };
    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === 'failed' || st === 'disconnected') {
        try { wsRef.current?.send(JSON.stringify({ type: 'signal', to: id, from: peerIdRef.current, data: { restart: true } })); } catch {}
      }
      if (st === 'closed') {
        pcsRef.current.delete(id);
        setRemoteStreams(m => { const n = new Map(m); n.delete(id); return n; });
      }
    };

    // Attach local stream tracks if present (for private calls)
    if (localStream) {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ensureWs().send(JSON.stringify({ type: 'signal', to: id, from: peerIdRef.current, data: { sdp: pc.localDescription } }));
    }

    return pc;
  }

  const callPeer = useCallback(async (id: string) => {
    await createPeer(id, true);
  }, []);

  const join = useCallback(() => {
    const ws = ensureWs();
    return ws;
  }, [ensureWs]);

  const switchRoom = useCallback((newRoomId: string) => {
    roomIdRef.current = newRoomId;
    // Close existing peer connections and clear remote streams
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    setPeers([]);
    setRemoteStreams(new Map());
    // Reuse WS if open, else it will send join on open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ type: 'join', roomId: newRoomId, role })); } catch {}
    } else {
      ensureWs();
    }
  }, [ensureWs, role]);

  const startLocal = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (e) { console.error(e); return null; }
  }, []);

  const stopLocal = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
  }, [localStream]);

  return {
    connected,
    peers,
    remoteStreams,
    localStream,
    join,
    switchRoom,
    callPeer,
    startLocal,
    stopLocal,
    restartPeerIce: async (peerId: string) => {
      const pc = pcsRef.current.get(peerId);
      if (pc) {
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          wsRef.current?.send(JSON.stringify({ type: 'signal', to: peerId, from: peerIdRef.current, data: { sdp: pc.localDescription } }));
        } catch {}
      }
    }
  };
}
