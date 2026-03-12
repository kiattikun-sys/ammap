"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Pencil, Check, X, Trash2 } from "lucide-react";
import { deleteSpatialNode } from "@/domains/spatial/actions/delete-spatial-node";
import type { SpatialTreeNode } from "@/domains/spatial/queries/get-spatial-tree";
import { updateSpatialNode } from "@/domains/spatial/actions/update-spatial-node";
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
} from "@/domains/spatial/services/spatial-drawing-service";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";

interface SpatialTreeNodeRowProps {
  node: SpatialTreeNode;
  depth: number;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onRename: (node: SpatialTreeNode) => void;
  onAddChild: (parentNode: SpatialTreeNode) => void;
  onDelete: (nodeId: string) => void;
}

export function SpatialTreeNodeRow({
  node,
  depth,
  isSelected,
  onSelect,
  onRename,
  onAddChild,
  onDelete,
}: SpatialTreeNodeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setEditValue(node.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, node.name]);

  async function handleRenameCommit() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === node.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSpatialNode(node.id, { name: trimmed });
      onRename({ ...node, name: trimmed });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRenameCommit();
    if (e.key === "Escape") setEditing(false);
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteSpatialNode(node.id);
      onDelete(node.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const hasChildren = node.children.length > 0;
  const typeKey = node.type as SpatialNodeType;
  const label = NODE_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer transition-colors ${
          isSelected ? "bg-blue-50" : "hover:bg-slate-50"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="h-3 w-3 rounded-sm border border-slate-200 inline-block opacity-30" />
          )}
        </button>

        {/* Type badge */}
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${colorClass}`}>
          {label[0]}
        </span>

        {/* Name or inline edit */}
        {editing ? (
          <div className="flex flex-1 items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="flex-1 min-w-0 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleRenameCommit}
              className="shrink-0 text-blue-600 hover:text-blue-800 disabled:opacity-40"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="shrink-0 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs font-medium text-slate-800">
            {node.name}
          </span>
        )}

        {/* Actions — shown on hover */}
        {!editing && !confirmDelete && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Rename"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              title="Add child node"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-[11px] font-bold leading-none"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
            >
              +
            </button>
            <button
              type="button"
              title="Delete node"
              className="rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}

        {/* Inline delete confirmation */}
        {confirmDelete && (
          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-red-500 font-medium">Delete?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100"
            >
              No
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="px-3 py-0.5 text-[10px] text-red-500">{error}</p>
      )}

      {/* Recursive children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <SpatialTreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={false}
              onSelect={onSelect}
              onRename={onRename}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
