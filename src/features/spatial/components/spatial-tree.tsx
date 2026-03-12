"use client";

import { useCallback, useState } from "react";
import { Plus, FolderTree } from "lucide-react";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import {
  buildTree,
  type SpatialTreeNode,
} from "@/domains/spatial/queries/get-spatial-tree";
import { SpatialTreeNodeRow } from "./spatial-tree-node-row";
import { CreateNodeDialog } from "./create-node-dialog";

interface SpatialTreeProps {
  projectId: string;
  nodes: SpatialNode[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onNodesChange: (nodes: SpatialNode[]) => void;
}

export function SpatialTree({
  projectId,
  nodes,
  selectedNodeId,
  onSelectNode,
  onNodesChange,
}: SpatialTreeProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createParent, setCreateParent] = useState<SpatialTreeNode | null>(null);
  const [search, setSearch] = useState("");

  const tree = buildTree(nodes, null);

  const filteredNodes = search.trim()
    ? nodes.filter((n) =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.type.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const filteredTree = filteredNodes ? buildTree(filteredNodes, null) : tree;

  function handleCreated(node: SpatialNode) {
    onNodesChange([...nodes, node]);
  }

  const handleRename = useCallback(
    (updated: SpatialTreeNode) => {
      onNodesChange(nodes.map((n) => (n.id === updated.id ? { ...n, name: updated.name } : n)));
    },
    [nodes, onNodesChange]
  );

  function collectDescendantIds(nodeId: string, allNodes: typeof nodes): string[] {
    const children = allNodes.filter((n) => n.parentId === nodeId);
    return [
      nodeId,
      ...children.flatMap((c) => collectDescendantIds(c.id, allNodes)),
    ];
  }

  function handleDelete(nodeId: string) {
    const toRemove = new Set(collectDescendantIds(nodeId, nodes));
    const updated = nodes.filter((n) => !toRemove.has(n.id));
    onNodesChange(updated);
    if (selectedNodeId && toRemove.has(selectedNodeId)) {
      onSelectNode?.(null);
    }
  }

  function handleAddChild(parent: SpatialTreeNode) {
    setCreateParent(parent);
    setShowCreateDialog(true);
  }

  function handleOpenCreate() {
    setCreateParent(null);
    setShowCreateDialog(true);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tree header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderTree size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Spatial Nodes</span>
          {nodes.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {nodes.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Search */}
      {nodes.length > 3 && (
        <div className="border-b border-slate-100 px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
          />
        </div>
      )}

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-2">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <FolderTree size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No spatial nodes yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a Site or Building to get started
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={13} />
              Add first node
            </button>
          </div>
        ) : filteredTree.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            No nodes match &ldquo;{search}&rdquo;
          </p>
        ) : (
          filteredTree.map((node) => (
            <SpatialTreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              isSelected={selectedNodeId === node.id}
              onSelect={(id) => onSelectNode?.(id)}
              onRename={handleRename}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateNodeDialog
          projectId={projectId}
          allNodes={nodes}
          defaultParent={createParent}
          onCreated={handleCreated}
          onClose={() => {
            setShowCreateDialog(false);
            setCreateParent(null);
          }}
        />
      )}
    </div>
  );
}
