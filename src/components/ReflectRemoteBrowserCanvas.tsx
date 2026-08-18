import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchApi } from '../api/client';

interface ReflectRemoteBrowserCanvasProps {
  startingUrl: string;
  deviceProfile: string;
  onSessionReady?: (sessionId: string) => void;
  onStepCreated?: (step: any) => void;
  onSessionCompleted?: (steps: any[]) => void;
  isRecording: boolean;
  onBindActions?: (actions: { goBack: () => void; goForward: () => void; reload: () => void }) => void;
}

// Fetch backend-issued JWT token (Item 10 requirement: Zero client-side JWT secret generation)
async function getBackendIssuedJwtToken(): Promise<string> {
  let userId = 'usr_1001_qa';
  let email = 'qa@testgenie.com';
  let role = 'QA_ENGINEER';

  try {
    const saved = localStorage.getItem('test_genie_authenticated_user_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.id) userId = parsed.id;
      if (parsed.email) email = parsed.email;
      if (parsed.role) role = parsed.role;
    }
  } catch (e) {}

  const res = await fetchApi<{ token: string }>('/users/token', {
    method: 'POST',
    body: JSON.stringify({ userId, email, role })
  });

  if (!res || !res.token) {
    throw new Error('Failed to obtain authenticated JWT token from NestJS backend.');
  }

  return res.token;
}

export const ReflectRemoteBrowserCanvas: React.FC<ReflectRemoteBrowserCanvasProps> = ({
  startingUrl,
  deviceProfile,
  onSessionReady,
  onStepCreated,
  onSessionCompleted,
  isRecording,
  onBindActions
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasReceivedFirstFrame, setHasReceivedFirstFrame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // Scroll Event Accumulator & Throttler (~200ms aggregation for smooth scrolling)
  const scrollBufferRef = useRef<{ deltaX: number; deltaY: number }>({ deltaX: 0, deltaY: 0 });
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Pre-initialize Canvas dimensions before first frame (Default 1280x720)
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, 1280, 720);
      }
    }

    let socket: Socket | null = null;
    let isCancelled = false;

    console.log('[SOCKET] Obtaining Backend-Issued JWT Authentication Header...');
    getBackendIssuedJwtToken().then((jwtToken) => {
      if (isCancelled) return;

      console.log('[SOCKET] Connecting to NestJS WebSocket Gateway at http://localhost:4600/ws/recorder...');
      socket = io('http://localhost:4600/ws/recorder', {
        transports: ['websocket'],
        autoConnect: true,
        auth: { token: `Bearer ${jwtToken}` }
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[SOCKET CONNECTED] Socket ID:', socket?.id);
        setIsConnected(true);
        socket?.emit('start_session', { startingUrl, deviceProfile });
      });

      socket.on('connect_error', (err) => {
        console.error('[SOCKET ERROR] Connection failed:', err.message);
        setErrorMessage(`WebSocket Connection Failed: ${err.message}`);
        setIsInitializing(false);
      });

      socket.on('disconnect', (reason) => {
        console.warn('[SOCKET DISCONNECTED] Reason:', reason);
        setIsConnected(false);
      });

      socket.on('session_ready', (data: { sessionId: string }) => {
        console.log('[SESSION READY] Session ID:', data.sessionId);
        setSessionId(data.sessionId);
        setIsInitializing(false);
        if (onSessionReady) onSessionReady(data.sessionId);

        if (onBindActions && socket) {
          onBindActions({
            goBack: () => socket?.emit('user_back', { sessionId: data.sessionId }),
            goForward: () => socket?.emit('user_forward', { sessionId: data.sessionId }),
            reload: () => socket?.emit('user_reload', { sessionId: data.sessionId })
          });
        }
      });

      socket.on('session_error', (data: { sessionId: string; error: string; code?: string }) => {
        console.error('[SESSION ERROR]', data.error);
        setErrorMessage(data.error);
        setIsInitializing(false);
      });

      socket.on('browser_frame', (data: { sessionId: string; frame: string; frameNumber?: number }) => {
        if (!hasReceivedFirstFrame) {
          setHasReceivedFirstFrame(true);
        }
        setFrameCount(prev => prev + 1);

        const cvs = canvasRef.current;
        if (!cvs) return;

        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
          if (cvs.width !== img.width || cvs.height !== img.height) {
            cvs.width = img.width;
            cvs.height = img.height;
          }
          ctx.drawImage(img, 0, 0);
        };
        img.src = `data:image/jpeg;base64,${data.frame}`;
      });

      socket.on('step_created', (data: { sessionId: string; step: any }) => {
        console.log('[STEP RECORDED]', data.step);
        if (onStepCreated) onStepCreated(data.step);
      });

      socket.on('session_completed', (data: { sessionId: string; steps: any[] }) => {
        console.log('[SESSION COMPLETED]', data.steps);
        if (onSessionCompleted) onSessionCompleted(data.steps);
      });
    }).catch((err) => {
      console.error('[SOCKET ERROR] Failed to obtain backend JWT token:', err);
      setErrorMessage(`Backend JWT Auth Error: ${err.message}`);
      setIsInitializing(false);
    });

    return () => {
      isCancelled = true;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [startingUrl, deviceProfile]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socketRef.current || !sessionId || !isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickEvent = {
      sessionId,
      clientX: e.clientX,
      clientY: e.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height
    };

    socketRef.current.emit('user_click', clickEvent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!socketRef.current || !sessionId || !isRecording) return;

    if (e.key === 'Tab' || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault();
    }

    socketRef.current.emit('user_key_press', {
      sessionId,
      key: e.key
    });
  };

  // 200ms Throttled Scroll Accumulator for Smooth Trackpad Inertia & Aggregation (Requirement #2)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!socketRef.current || !sessionId || !isRecording) return;

    scrollBufferRef.current.deltaX += e.deltaX;
    scrollBufferRef.current.deltaY += e.deltaY;

    if (!scrollTimerRef.current) {
      scrollTimerRef.current = setTimeout(() => {
        if (socketRef.current && sessionId && (scrollBufferRef.current.deltaX !== 0 || scrollBufferRef.current.deltaY !== 0)) {
          socketRef.current.emit('user_scroll', {
            sessionId,
            deltaX: Math.round(scrollBufferRef.current.deltaX),
            deltaY: Math.round(scrollBufferRef.current.deltaY)
          });
        }
        scrollBufferRef.current = { deltaX: 0, deltaY: 0 };
        scrollTimerRef.current = null;
      }, 200); // Emit aggregated scroll event every 200ms
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-xs shadow-xl">
        <div className="flex items-center space-x-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="font-mono text-slate-300 font-bold">
            {isConnected ? `STREAMING REMOTE VIEWPORT (${frameCount} frames)` : 'CONNECTING TO REMOTE ENGINE...'}
          </span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{deviceProfile}</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Remote Playwright Execution</span>
        </div>
      </div>

      {/* Main Canvas Streaming Surface */}
      <div
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`relative max-w-full max-h-full p-2 outline-none cursor-crosshair transition-all ${
          isFocused ? 'ring-2 ring-indigo-500 rounded-lg' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          className="rounded shadow-2xl border border-slate-800 max-w-full max-h-[calc(100vh-140px)] object-contain bg-slate-950"
        />

        {/* Initialization Overlay */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30 rounded">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="font-mono text-sm font-bold text-slate-200">Provisioning Remote Chromium Session...</p>
            <p className="font-mono text-xs text-slate-500 mt-1">Starting Playwright instance & CDP screencast pipeline</p>
          </div>
        )}

        {/* Error Overlay */}
        {errorMessage && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white z-40 p-6 rounded">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="font-bold text-lg text-rose-400">Recording Session Error</h3>
            <p className="font-mono text-xs text-slate-300 bg-rose-950/80 border border-rose-800/80 px-4 py-2 rounded-xl mt-3 max-w-lg text-center">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
