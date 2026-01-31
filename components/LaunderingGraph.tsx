import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, WalletRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { useForensics } from '../context/ForensicsContext';

interface LaunderingGraphProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export const LaunderingGraph: React.FC<LaunderingGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const { selectWallet } = useForensics();

  // Filter logic: Only show suspicious subgraphs (connected to suspicious nodes)
  const filteredData = useMemo(() => {
    const suspiciousIds = new Set(
      data.nodes
        .filter(n => n.role !== WalletRole.NORMAL)
        .map(n => n.id)
    );

    // Include neighbors of suspicious nodes to show context
    const relevantLinks = data.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      return suspiciousIds.has(sourceId as string) || suspiciousIds.has(targetId as string);
    });

    const relevantNodeIds = new Set<string>();
    relevantLinks.forEach(l => {
        relevantNodeIds.add(typeof l.source === 'object' ? (l.source as GraphNode).id : l.source as string);
        relevantNodeIds.add(typeof l.target === 'object' ? (l.target as GraphNode).id : l.target as string);
    });

    const relevantNodes = data.nodes.filter(n => relevantNodeIds.has(n.id));

    // If no suspicious activity, show everything (fallback) or show empty state
    if (relevantNodes.length === 0) return data;

    return { nodes: relevantNodes.map(n => ({...n})), links: relevantLinks.map(l => ({...l})) };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = 600;
    const colorMap = {
      [WalletRole.SOURCE]: '#ef4444', // Red
      [WalletRole.MULE]: '#f97316',   // Orange
      [WalletRole.AGGREGATOR]: '#8b5cf6', // Violet
      [WalletRole.NORMAL]: '#64748b'  // Slate
    };

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Arrows
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
      .attr("fill", "#94a3b8")
      .attr("d", "M0,-5L10,0L0,5");

    const simulation = d3.forceSimulation(filteredData.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(filteredData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    const link = svg.append("g")
      .selectAll("line")
      .data(filteredData.links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .selectAll("g")
      .data(filteredData.nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Node Circles
    node.append("circle")
      .attr("r", (d: GraphNode) => Math.min(Math.max(d.val * 3, 8), 20))
      .attr("fill", (d: GraphNode) => colorMap[d.role])
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-opacity hover:opacity-80")
      .on("click", (event, d: GraphNode) => {
        selectWallet(d.id);
        navigate(`/wallet/${d.id}`);
      });

    // Labels
    node.append("text")
      .text((d: GraphNode) => d.id.substring(0, 6) + '...')
      .attr("x", 12)
      .attr("y", 3)
      .attr("fill", "#cbd5e1")
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

  return (
    <div className="relative w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 backdrop-blur-sm z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Topology Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Source (Fan-Out)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span> Mule (Layering)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500"></span> Aggregator (Fan-In)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span> Normal
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-[600px] block cursor-move"></svg>
    </div>
  );
};