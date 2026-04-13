"use client";

import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Mail, Zap, Share2 } from 'lucide-react';

const initialNodes = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { 
      label: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
            <Zap className="w-3 h-3 fill-current" />
            Trigger
          </div>
          <div className="text-xs font-bold uppercase tracking-tight">New Subscriber Joined</div>
        </div>
      ) 
    },
    style: { 
      background: 'var(--background)', 
      color: 'var(--foreground)',
      border: '2px solid var(--accent)',
      borderRadius: '0px',
      padding: '12px',
      width: 200,
    },
  },
  {
    id: '2',
    position: { x: 400, y: 100 },
    data: { 
      label: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
            <Mail className="w-3 h-3" />
            Action
          </div>
          <div className="text-xs font-bold uppercase tracking-tight">Send Welcome Transmission</div>
        </div>
      ) 
    },
    style: { 
      background: 'var(--background)', 
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
      borderRadius: '0px',
      padding: '12px',
      width: 200,
    },
  },
  {
    id: '3',
    position: { x: 400, y: 250 },
    data: { 
      label: (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
            <Share2 className="w-3 h-3" />
            Action
          </div>
          <div className="text-xs font-bold uppercase tracking-tight">Broadcast to Social Sync</div>
        </div>
      ) 
    },
    style: { 
      background: 'var(--background)', 
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
      borderRadius: '0px',
      padding: '12px',
      width: 200,
    },
  },
];

const initialEdges = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true,
    style: { stroke: 'var(--accent)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }
  },
  { 
    id: 'e1-3', 
    source: '1', 
    target: '3',
    style: { stroke: 'var(--border)', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border)' }
  },
];

export default function AutomationCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full w-full bg-grid relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="var(--border)" gap={20} size={1} />
        <Controls 
          className="bg-background border-industrial rounded-none shadow-none" 
          showInteractive={false}
        />
        <MiniMap 
          className="bg-background border-industrial rounded-none"
          nodeColor="var(--muted)"
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>

      {/* Blueprint Overlay decals */}
      <div className="absolute top-4 left-4 pointer-events-none select-none">
         <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent opacity-50 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent animate-pulse" />
            Systems Online // Blueprint v4.2
         </div>
      </div>
      
      <div className="absolute bottom-4 right-20 pointer-events-none select-none text-right">
         <div className="text-[8px] font-mono text-muted-foreground uppercase leading-tight">
            ALOHA AUTOMATION ENGINE<br/>
            RECURSIVE LOGIC PROCESSOR [ACTIVE]<br/>
            COORD: 45.2N / 12.8W
         </div>
      </div>
    </div>
  );
}
