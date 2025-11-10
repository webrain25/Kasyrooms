import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { randomUUID } from 'crypto';

export type PeerRole = 'user'|'model'|'admin';

type RoomId = string;

interface Peer {
  id: string;
  socket: WebSocket;
  roomId: RoomId;
  role: PeerRole;
}

interface SignalMessage {
  type: 'signal';
  to: string;
  from: string;
  data: any;
}
interface JoinMessage {
  type: 'join';
  roomId: string;
  role?: PeerRole;
  peerId?: string;
}
interface LeaveMessage { type: 'leave'; peerId: string; }
interface PeersMessage { type: 'peers'; peers: Array<{ id: string; role: PeerRole }>; }

function safeJson(data: any): string { try { return JSON.stringify(data); } catch { return '{}'; } }

export function initSignaling(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/rooms' });
  const peers = new Map<string, Peer>();
  const rooms = new Map<RoomId, Set<string>>();

  function addToRoom(roomId: RoomId, peerId: string) {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(peerId);
  }
  function removeFromRoom(roomId: RoomId, peerId: string) {
    const set = rooms.get(roomId);
    if (set) {
      set.delete(peerId);
      if (set.size === 0) rooms.delete(roomId);
    }
  }
  function broadcast(roomId: RoomId, msg: any, exceptId?: string) {
    const set = rooms.get(roomId);
    if (!set) return;
    const payload = safeJson(msg);
    set.forEach(pid => {
      if (pid === exceptId) return;
      const p = peers.get(pid);
      if (p && p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(payload);
      }
    });
  }

  wss.on('connection', (ws) => {
    let currentPeerId: string | null = null;

    ws.on('message', (raw) => {
      let msg: any;
      try { msg = JSON.parse(String(raw)); } catch { return; }
      if (msg?.type === 'ping') { try { ws.send(safeJson({ type: 'pong', t: msg.t || Date.now() })); } catch {} return; }
      if (msg?.type === 'join') {
        const join = msg as JoinMessage;
        const roomId = String(join.roomId || '').trim();
        if (!roomId) return;
        const pid = join.peerId && typeof join.peerId === 'string' ? join.peerId : randomUUID();
        const role: PeerRole = (join.role === 'model' || join.role === 'admin') ? join.role : 'user';
        currentPeerId = pid;
        peers.set(pid, { id: pid, socket: ws, roomId, role });
        addToRoom(roomId, pid);
        // send peers list to the new peer
        const list: PeersMessage = { type: 'peers', peers: Array.from(rooms.get(roomId) || []).filter(id => id !== pid).map(id => ({ id, role: peers.get(id)?.role || 'user' })) };
        ws.send(safeJson(list));
        // notify others that someone joined
        broadcast(roomId, { type: 'join', peerId: pid, role }, pid);
        return;
      }
      if (msg?.type === 'signal') {
        const sig = msg as SignalMessage;
        const toPeer = peers.get(sig.to);
        if (toPeer && toPeer.socket.readyState === WebSocket.OPEN) {
          toPeer.socket.send(safeJson({ type: 'signal', from: sig.from, data: sig.data }));
        }
        return;
      }
    });

    ws.on('close', () => {
      if (!currentPeerId) return;
      const p = peers.get(currentPeerId);
      if (!p) return;
      peers.delete(currentPeerId);
      removeFromRoom(p.roomId, currentPeerId);
      broadcast(p.roomId, { type: 'leave', peerId: currentPeerId });
      currentPeerId = null;
    });

    // keep-alive
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) { clearInterval(interval); return; }
      try { ws.ping(); } catch {}
    }, 30000);
    ws.on('close', () => clearInterval(interval));
  });

  return wss;
}
