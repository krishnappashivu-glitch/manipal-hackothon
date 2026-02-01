import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, WalletRole, FilterOptions } from '../types';
import { useNavigate } from 'react-router-dom';
import { useForensics } from '../context/ForensicsContext';
import { Plus, Minus, Maximize, Activity } from 'lucide-react';

interface LaunderingGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  filters: FilterOptions;
}

export const LaunderingGraph: React.FC<LaunderingGraphProps> = ({ data, filters }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const navigate = useNavigate();
  const { selectWallet, data: contextData } = useForensics();

  const filteredData = useMemo(() => {
    // 1. Filter Nodes by Score and Amount
    let activeNodes = data.nodes.filter(n => {
        // If showNormal is false, only show suspicious.
        // Suspicious is role != NORMAL OR score > minScore
        if (!filters.showNormal && n.role === WalletRole.NORMAL) return false;
        
        return n.analysis.suspicionScore >= filters.minScore;
    });

    // CHECK FOR LIVE STREAM
    const isLive = contextData?.sourceType === 'LIVE_ETH' || contextData?.sourceType === 'LIVE_BTC' || contextData?.sourceType === 'LIVE_GLOBAL';

    if (isLive) {
        // Sort by Suspicion Score (High to Low), then Volume (High to Low)
        activeNodes.sort((a, b) => {
            const scoreDiff = b.analysis.suspicionScore - a.analysis.suspicionScore;
            // Use a small epsilon for float comparison if needed, but simple subtraction works for sort
            if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
            return b.val - a.val;
        });

        // STRICT LIMIT: Top 10 Nodes
        activeNodes = activeNodes.slice(0, 10);
    }

    const activeIds = new Set(activeNodes.map(n => n.id));

    // 2. Filter Links
    const activeLinks = data.links.filter(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return activeIds.has(sourceId as string) && activeIds.has(targetId as string);
    });

    return { 
        nodes: activeNodes.map(n => ({...n})), 
        links: activeLinks.map(l => ({...l})) 
    };
  }, [data, filters, contextData?.sourceType]);

  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes.length) {
        // Clear if no data
        if(svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const width = svgRef.current.clientWidth;
    const height = 600;
    const colorMap = {
      [WalletRole.SOURCE]: '#ef4444', // Red
      [WalletRole.MULE]: '#f97316',   // Orange
      [WalletRole.DESTINATION]: '#8b5cf6', // Violet
      [WalletRole.NORMAL]: '#71717a'  // Zinc-500
    };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Add Zoom Behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    zoomRef.current = zoom;
    svg.call(zoom);

    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#a1a1aa") // Zinc-400
      .attr("d", "M0,-5L10,0L0,5");

    const simulation = d3.forceSimulation(filteredData.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(filteredData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Append to g instead of svg
    const link = g.append("g")
      .selectAll("line")
      .data(filteredData.links)
      .join("line")
      .attr("stroke", "#3f3f46") // Zinc-700
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    // Append to g instead of svg
    const node = g.append("g")
      .selectAll("g")
      .data(filteredData.nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    node.append("circle")
      .attr("r", (d: GraphNode) => Math.min(Math.max(d.val * 3, 8), 20))
      .attr("fill", (d: GraphNode) => colorMap[d.role])
      .attr("stroke", "#27272a") // Zinc-800
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-opacity hover:opacity-80")
      .on("click", (event, d: GraphNode) => {
        // Stop propagation to prevent zoom click
        event.stopPropagation();
        selectWallet(d.id);
        navigate(`/wallet/${d.id}`);
      });

    node.append("text")
      .text((d: GraphNode) => d.id.substring(0, 6) + '...')
      .attr("x", 12)
      .attr("y", 3)
      .attr("fill", "#d4d4d8") // Zinc-300
      .style("font-size", "10px")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [filteredData, navigate, selectWallet]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.2);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const isLive = contextData?.sourceType === 'LIVE_ETH' || contextData?.sourceType === 'LIVE_BTC' || contextData?.sourceType === 'LIVE_GLOBAL';

  return (
    <div className="relative w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 backdrop-blur-sm z-10 pointer-events-none select-none">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Topology Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Source (Fan-Out)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span> Mule (Layering)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span> Destination (Fan-In)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-500"></span> Normal
          </div>
        </div>
        {isLive && (
             <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-amber-500 flex items-center gap-1 font-bold">
                 <Activity size={12} className="animate-pulse" />
                 LIVE: Top 10 Risk Nodes
             </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
            onClick={handleZoomIn}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors shadow-lg"
            title="Zoom In"
        >
            <Plus size={20} />
        </button>
        <button 
            onClick={handleZoomOut}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors shadow-lg"
            title="Zoom Out"
        >
            <Minus size={20} />
        </button>
        <button 
            onClick={handleResetZoom}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors shadow-lg"
            title="Reset View"
        >
            <Maximize size={20} />
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-[600px] block cursor-move"></svg>
    </div>
  );
};