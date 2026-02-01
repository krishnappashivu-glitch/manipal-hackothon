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
      [WalletRole.NORMAL]: '#94a3b8'  // Slate-400 (Lighter for nodes in white theme)
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
      .attr("fill", "#cbd5e1") // Slate-300
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
      .attr("stroke", "#e2e8f0") // Slate-200 (Very light grey for links)
      .attr("stroke-opacity", 1)
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
      .attr("stroke", "#fff") // White stroke for nodes
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-opacity hover:opacity-80 shadow-sm")
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
      .attr("fill", "#475569") // Slate-600 (Dark text)
      .style("font-size", "10px")
      .style("font-weight", "600")
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
    <div className="relative w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg border border-slate-200 backdrop-blur-sm z-10 pointer-events-none select-none shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topology Legend</h3>
        <div className="space-y-2 text-xs text-slate-700">
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
            <span className="w-3 h-3 rounded-full bg-slate-400"></span> Normal
          </div>
        </div>
        {isLive && (
             <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-amber-600 flex items-center gap-1 font-bold">
                 <Activity size={12} className="animate-pulse" />
                 LIVE: Top 10 Risk Nodes
             </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
            onClick={handleZoomIn}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors shadow-sm"
            title="Zoom In"
        >
            <Plus size={20} />
        </button>
        <button 
            onClick={handleZoomOut}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors shadow-sm"
            title="Zoom Out"
        >
            <Minus size={20} />
        </button>
        <button 
            onClick={handleResetZoom}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors shadow-sm"
            title="Reset View"
        >
            <Maximize size={20} />
        </button>
      </div>

      <svg ref={svgRef} className="w-full h-[600px] block cursor-move"></svg>
    </div>
  );
};