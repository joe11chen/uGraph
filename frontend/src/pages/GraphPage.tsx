import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  type ReactFlowInstance,
  useNodesState
} from "@xyflow/react";
import { Download, FilePlus2, FolderKanban, LayoutDashboard, LocateFixed, Network, Save, Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateCanvasLayout, updateCanvasNodePosition } from "../api/canvas";
import { exportProjectMarkdown } from "../api/export";
import { createPaper, deletePaper, getPaper, updatePaper } from "../api/papers";
import { getDefaultProject, getProjectGraph } from "../api/projects";
import { createRelationLabel, deleteRelationLabel, getIncomingRelations, updateIncomingRelations, updateRelationLabel } from "../api/relations";
import { AlertDialog } from "../components/AlertDialog";
import { NoticeBanner } from "../components/NoticeBanner";
import { CreateNodeDialog } from "../features/graph/CreateNodeDialog";
import { DeleteNodeDialog } from "../features/graph/DeleteNodeDialog";
import { EditNodeDialog } from "../features/graph/EditNodeDialog";
import {
  defaultNodeHeight,
  defaultNodeWidth,
  getNodeCenter,
  resolveEdgeRoute,
  type EdgeRoute
} from "../features/graph/edgeRouting";
import { calculateGraphLayout, type LayoutPosition } from "../features/graph/graphLayout";
import { PaperNode, type PaperNodeData } from "../features/graph/PaperNode";
import { RelationLabelsDialog } from "../features/graph/RelationLabelsDialog";
import type { PaperMetadata } from "../types/paper";
import type { IncomingRelationGroup } from "../types/relation";
import { getErrorMessage } from "../utils/errors";
import { formatPaperStatus, formatRelationName } from "../utils/labels";

const nodeTypes = { paper: PaperNode };
const maxSearchResults = 8;

type LayoutMutationPayload = {
  canvasId: string;
  nextPositions: LayoutPosition[];
  previousPositions: Map<string, { x: number; y: number }>;
};

function lineStyleToDasharray(lineStyle: string): string | undefined {
  if (lineStyle === "dashed") {
    return "8 6";
  }
  if (lineStyle === "dotted") {
    return "2 6";
  }
  return undefined;
}

function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(" ");
  }
  return String(value);
}

function formatProjectName(value: string | undefined): string {
  return value && value !== "Default Project" ? value : "研究资料库";
}

export function GraphPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isRelationSettingsOpen, setRelationSettingsOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [editingCanvasNodeId, setEditingCanvasNodeId] = useState<string | null>(null);
  const [deletingCanvasNodeId, setDeletingCanvasNodeId] = useState<string | null>(null);
  const [isDraggingNode, setDraggingNode] = useState(false);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<PaperNodeData>, Edge> | null>(null);
  const suppressNextNodeClickRef = useRef(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PaperNodeData>>([]);
  const [edgeRoutes, setEdgeRoutes] = useState<Map<string, EdgeRoute>>(() => new Map());

  const clearNoticeMessage = useCallback(() => setNoticeMessage(null), []);
  const clearErrorMessage = useCallback(() => setErrorMessage(null), []);
  const fitGraph = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void flowInstance?.fitView({ padding: 0.18, duration: 420 });
      });
    });
  }, [flowInstance]);

  const projectQuery = useQuery({
    queryKey: ["default-project"],
    queryFn: getDefaultProject
  });

  const graphQuery = useQuery({
    queryKey: ["graph", projectQuery.data?.id],
    queryFn: () => getProjectGraph(projectQuery.data!.id),
    enabled: Boolean(projectQuery.data?.id)
  });

  const paperIdByCanvasNode = useMemo(() => {
    const mapping = new Map<string, string>();
    graphQuery.data?.nodes.forEach((node) => mapping.set(node.id, node.paper_id));
    return mapping;
  }, [graphQuery.data]);

  const canvasNodeIdByPaper = useMemo(() => {
    const mapping = new Map<string, string>();
    graphQuery.data?.nodes.forEach((node) => mapping.set(node.paper_id, node.id));
    return mapping;
  }, [graphQuery.data]);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const editingPaperId = editingCanvasNodeId ? paperIdByCanvasNode.get(editingCanvasNodeId) : undefined;

  const deletingGraphNode = useMemo(
    () => graphQuery.data?.nodes.find((node) => node.id === deletingCanvasNodeId) ?? null,
    [deletingCanvasNodeId, graphQuery.data]
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return (
      graphQuery.data?.nodes.filter((node) => {
        const metadata = node.paper.metadata;
        const searchable = [
          node.paper.title,
          normalizeSearchText(metadata.authors),
          normalizeSearchText(metadata.venue),
          normalizeSearchText(metadata.tags),
          normalizeSearchText(metadata.status),
          formatPaperStatus(metadata.status),
          normalizeSearchText(metadata.tldr)
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      }) ?? []
    );
  }, [graphQuery.data, searchQuery]);

  const visibleSearchResults = searchResults.slice(0, maxSearchResults);

  const editPaperQuery = useQuery({
    queryKey: ["paper", editingPaperId],
    queryFn: () => getPaper(editingPaperId!),
    enabled: Boolean(editingPaperId)
  });

  const incomingRelationsQuery = useQuery({
    queryKey: ["incoming-relations", editingPaperId],
    queryFn: () => getIncomingRelations(editingPaperId!),
    enabled: Boolean(editingPaperId)
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createPaper>[1]) => createPaper(projectQuery.data!.id, payload),
    onSuccess: async () => {
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "文献创建失败"))
  });

  const positionMutation = useMutation({
    mutationFn: (payload: { canvasNodeId: string; x: number; y: number }) =>
      updateCanvasNodePosition(payload.canvasNodeId, payload.x, payload.y),
    onError: (error) => setErrorMessage(getErrorMessage(error, "布局保存失败"))
  });

  const layoutMutation = useMutation({
    mutationFn: ({ canvasId, nextPositions }: LayoutMutationPayload) =>
      updateCanvasLayout(
        canvasId,
        nextPositions.map((position) => ({
          canvas_node_id: position.id,
          x: position.x,
          y: position.y
        }))
      ),
    onMutate: ({ nextPositions }) => {
      const nextById = new Map(nextPositions.map((position) => [position.id, position]));
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const nextPosition = nextById.get(node.id);
          return nextPosition ? { ...node, position: { x: nextPosition.x, y: nextPosition.y } } : node;
        })
      );
      fitGraph();
    },
    onSuccess: async () => {
      setNoticeMessage("布局已整理并保存");
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error, { previousPositions }) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const previousPosition = previousPositions.get(node.id);
          return previousPosition ? { ...node, position: previousPosition } : node;
        })
      );
      fitGraph();
      setErrorMessage(getErrorMessage(error, "布局整理失败，已恢复原位置"));
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => exportProjectMarkdown(projectQuery.data!.id),
    onSuccess: (result) => setNoticeMessage(`导出完成，文件已保存到 ${result.export_path}`),
    onError: (error) => setErrorMessage(getErrorMessage(error, "导出失败"))
  });

  const updateNodeMutation = useMutation({
    mutationFn: async (payload: { title: string; metadata: PaperMetadata; relationGroups: IncomingRelationGroup[] }) => {
      const paper = await updatePaper(editingPaperId!, {
        title: payload.title,
        metadata: payload.metadata,
        markdown_content: editPaperQuery.data!.markdown_content,
        version: editPaperQuery.data!.version
      });
      await updateIncomingRelations(editingPaperId!, { groups: payload.relationGroups });
      return paper;
    },
    onSuccess: async (paper) => {
      setNoticeMessage("文献已更新");
      setEditingCanvasNodeId(null);
      await queryClient.invalidateQueries({ queryKey: ["paper", paper.id] });
      await queryClient.invalidateQueries({ queryKey: ["incoming-relations", paper.id] });
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "文献保存失败"))
  });

  const deleteMutation = useMutation({
    mutationFn: (paperId: string) => deletePaper(paperId),
    onSuccess: async () => {
      setNoticeMessage("文献已删除");
      setExpandedNodeId(null);
      setEditingCanvasNodeId(null);
      setDeletingCanvasNodeId(null);
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "删除失败"))
  });

  const createRelationLabelMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createRelationLabel>[1]) => createRelationLabel(projectQuery.data!.id, payload),
    onSuccess: async () => {
      setNoticeMessage("关系类型已添加");
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "关系类型创建失败"))
  });

  const updateRelationLabelMutation = useMutation({
    mutationFn: (payload: { labelId: string; value: Parameters<typeof updateRelationLabel>[1] }) =>
      updateRelationLabel(payload.labelId, payload.value),
    onSuccess: async () => {
      setNoticeMessage("关系类型已更新");
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "关系类型保存失败"))
  });

  const deleteRelationLabelMutation = useMutation({
    mutationFn: (labelId: string) => deleteRelationLabel(labelId),
    onSuccess: async () => {
      setNoticeMessage("关系类型已删除");
      await queryClient.invalidateQueries({ queryKey: ["graph", projectQuery.data?.id] });
    },
    onError: (error) => setErrorMessage(getErrorMessage(error, "关系类型删除失败"))
  });

  const openNodeEditor = useCallback((canvasNodeId: string) => {
    setExpandedNodeId(canvasNodeId);
    setEditingCanvasNodeId(canvasNodeId);
  }, []);

  const focusGraphNode = useCallback(
    (canvasNodeId: string) => {
      const graphNode = graphQuery.data?.nodes.find((node) => node.id === canvasNodeId);
      if (!graphNode) {
        setErrorMessage("未找到要定位的文献");
        return;
      }

      const currentNode = nodeById.get(canvasNodeId);
      const center = currentNode
        ? getNodeCenter(currentNode)
        : {
            x: graphNode.position.x + defaultNodeWidth / 2,
            y: graphNode.position.y + defaultNodeHeight / 2
          };
      setExpandedNodeId(canvasNodeId);
      window.requestAnimationFrame(() => {
        void flowInstance?.setCenter(center.x, center.y, {
          zoom: 1.08,
          duration: 420
        });
      });
    },
    [flowInstance, graphQuery.data, nodeById]
  );

  const requestDeleteNode = useCallback(
    (canvasNodeId: string) => {
      const graphNode = graphQuery.data?.nodes.find((node) => node.id === canvasNodeId);
      if (!graphNode) {
        setErrorMessage("未找到要删除的文献");
        return;
      }

      setExpandedNodeId(canvasNodeId);
      setDeletingCanvasNodeId(canvasNodeId);
    },
    [graphQuery.data]
  );

  const graphNodesFromData = useMemo<Node<PaperNodeData>[]>(
    () =>
      graphQuery.data?.nodes.map((node) => ({
        id: node.id,
        type: "paper",
        position: node.position,
        data: {
          canvasNodeId: node.id,
          title: node.paper.title,
          metadata: node.paper.metadata,
          expanded: false,
          onEdit: openNodeEditor,
          onDelete: requestDeleteNode
        },
        selectable: true
      })) ?? [],
    [graphQuery.data, openNodeEditor, requestDeleteNode]
  );

  useEffect(() => {
    setEdgeRoutes((currentRoutes) => {
      const nextRoutes = new Map<string, EdgeRoute>();
      graphQuery.data?.edges.forEach((edge) => {
        const sourceId = canvasNodeIdByPaper.get(edge.source_paper_id);
        const targetId = canvasNodeIdByPaper.get(edge.target_paper_id);
        const sourceNode = sourceId ? nodeById.get(sourceId) : undefined;
        const targetNode = targetId ? nodeById.get(targetId) : undefined;
        if (sourceNode && targetNode) {
          nextRoutes.set(edge.id, resolveEdgeRoute(sourceNode, targetNode, currentRoutes.get(edge.id)));
        }
      });

      const hasChanged =
        currentRoutes.size !== nextRoutes.size ||
        Array.from(nextRoutes).some(([edgeId, nextRoute]) => {
          const currentRoute = currentRoutes.get(edgeId);
          return (
            currentRoute?.axis !== nextRoute.axis ||
            currentRoute?.sourceHandle !== nextRoute.sourceHandle ||
            currentRoute?.targetHandle !== nextRoute.targetHandle
          );
        });
      return hasChanged ? nextRoutes : currentRoutes;
    });
  }, [canvasNodeIdByPaper, graphQuery.data?.edges, nodeById]);

  const graphEdges = useMemo<Edge[]>(
    () => {
      const labels = new Map(graphQuery.data?.relation_labels.map((label) => [label.id, label]) ?? []);
      return graphQuery.data?.edges.flatMap((edge) => {
        const source = canvasNodeIdByPaper.get(edge.source_paper_id);
        const target = canvasNodeIdByPaper.get(edge.target_paper_id);
        const label = labels.get(edge.label_id);
        if (!source || !target || !label) {
          return [];
        }
        const sourceNode = nodeById.get(source);
        const targetNode = nodeById.get(target);
        const route =
          edgeRoutes.get(edge.id) ??
          (sourceNode && targetNode ? resolveEdgeRoute(sourceNode, targetNode) : undefined);
        return [
          {
            id: edge.id,
            source,
            target,
            sourceHandle: route?.sourceHandle,
            targetHandle: route?.targetHandle,
            label: `${label.emoji} ${formatRelationName(label.name)}`,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: label.color },
            style: {
              stroke: label.color,
              strokeWidth: 2,
              strokeDasharray: lineStyleToDasharray(label.line_style)
            },
            labelStyle: {
              fill: "var(--ink)",
              fontFamily: "Segoe UI, sans-serif",
              fontSize: 11,
              fontWeight: 800
            },
            labelBgStyle: {
              fill: "var(--paper)",
              fillOpacity: 0.86
            },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 4
          }
        ];
      }) ?? [];
    },
    [canvasNodeIdByPaper, edgeRoutes, graphQuery.data, nodeById]
  );

  const canArrangeGraph = Boolean(graphQuery.data?.canvas.id) &&
    nodes.length > 0 &&
    !isDraggingNode &&
    !positionMutation.isPending &&
    !layoutMutation.isPending;

  const arrangeGraph = useCallback(() => {
    const canvasId = graphQuery.data?.canvas.id;
    if (!canvasId || !canArrangeGraph) {
      return;
    }

    layoutMutation.mutate({
      canvasId,
      nextPositions: calculateGraphLayout(nodes, graphEdges),
      previousPositions: new Map(nodes.map((node) => [node.id, { ...node.position }]))
    });
  }, [canArrangeGraph, graphEdges, graphQuery.data?.canvas.id, layoutMutation, nodes]);

  useEffect(() => {
    setNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node) => [node.id, node]));
      return graphNodesFromData.map((nextNode) => {
        const currentNode = currentById.get(nextNode.id);
        return {
          ...nextNode,
          position: currentNode?.position ?? nextNode.position,
          selected: currentNode?.selected ?? nextNode.selected,
          dragging: currentNode?.dragging ?? nextNode.dragging,
          data: {
            ...nextNode.data,
            expanded: nextNode.id === expandedNodeId
          }
        };
      });
    });
  }, [expandedNodeId, graphNodesFromData, setNodes]);

  const onNodeDragStop: OnNodeDrag<Node<PaperNodeData>> = useCallback(
    (_event, node) => {
      setDraggingNode(false);
      window.setTimeout(() => {
        suppressNextNodeClickRef.current = false;
      }, 0);
      if (!layoutMutation.isPending) {
        positionMutation.mutate({ canvasNodeId: node.id, x: node.position.x, y: node.position.y });
      }
    },
    [layoutMutation.isPending, positionMutation]
  );

  const onNodeDragStart: OnNodeDrag<Node<PaperNodeData>> = useCallback(() => {
    setDraggingNode(true);
    suppressNextNodeClickRef.current = true;
  }, []);

  const onNodeClick: NodeMouseHandler<Node<PaperNodeData>> = useCallback((_event, node) => {
    if (isDraggingNode || suppressNextNodeClickRef.current) {
      suppressNextNodeClickRef.current = false;
      return;
    }
    setExpandedNodeId((current) => (current === node.id ? null : node.id));
  }, [isDraggingNode]);

  const onNodeDoubleClick: NodeMouseHandler<Node<PaperNodeData>> = useCallback(
    (_event, node) => {
      const paperId = paperIdByCanvasNode.get(node.id);
      if (paperId) {
        navigate(`/papers/${paperId}/edit`);
      }
    },
    [navigate, paperIdByCanvasNode]
  );

  const onPaneClick = useCallback(() => {
    setExpandedNodeId(null);
  }, []);

  if (projectQuery.isLoading || graphQuery.isLoading) {
    return <div className="page-state">正在打开研究网络...</div>;
  }

  if (projectQuery.error || graphQuery.error) {
    return <div className="page-state error">研究网络加载失败</div>;
  }

  const paperCount = nodes.length;
  const taggedCount =
    graphQuery.data?.nodes.filter((node) => Array.isArray(node.paper.metadata.tags) && node.paper.metadata.tags.length > 0).length ?? 0;

  return (
    <div className="graph-page">
      <header className="topbar graph-topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <Network size={22} />
          </div>
          <div>
            <span className="eyebrow">uGraph</span>
            <h1>文献工作台</h1>
            <p>{formatProjectName(projectQuery.data?.name)}</p>
          </div>
        </div>
        <div className="toolbar">
          <button className="primary-action" onClick={() => setCreateOpen(true)}>
            <FilePlus2 size={17} />
            新建文献
          </button>
          <button onClick={() => setRelationSettingsOpen(true)}>
            <SlidersHorizontal size={17} />
            关系管理
          </button>
          <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download size={17} />
            {exportMutation.isPending ? "导出中" : "导出笔记"}
          </button>
        </div>
      </header>
      <NoticeBanner message={noticeMessage} onDismiss={clearNoticeMessage} />
      <main className="graph-shell">
        <aside className="graph-command-panel">
          <div className="panel-heading">
            <FolderKanban size={18} />
            <span>研究概览</span>
          </div>
          <div className="graph-stats">
            <div>
              <strong>{paperCount}</strong>
              <span>文献</span>
            </div>
            <div>
              <strong>{taggedCount}</strong>
              <span>已归类</span>
            </div>
          </div>
          <button
            type="button"
            className="graph-layout-action"
            onClick={arrangeGraph}
            disabled={!canArrangeGraph}
          >
            <LayoutDashboard size={16} />
            {layoutMutation.isPending ? "整理中" : "整理布局"}
          </button>
          <div className="panel-tip">
            <Save size={16} />
            <span>{positionMutation.isPending || layoutMutation.isPending ? "保存布局中" : "拖动节点后自动保存"}</span>
          </div>
          <div className="graph-search">
            <label htmlFor="graph-node-search">
              <span className="label-with-icon">
                <Search size={15} />
                搜索文献
              </span>
              <div className="search-input-wrap">
                <input
                  id="graph-node-search"
                  type="search"
                  value={searchQuery}
                  placeholder="标题、标签、状态或 TLDR"
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchQuery ? (
                  <button
                    className="icon-button search-clear-button"
                    type="button"
                    aria-label="清空搜索"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>
            </label>
            {searchQuery.trim() ? (
              <div className="search-results">
                {visibleSearchResults.length > 0 ? (
                  visibleSearchResults.map((node) => {
                    const metadata = node.paper.metadata;
                    const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
                    const tldr = String(metadata.tldr ?? "").trim();
                    return (
                      <button key={node.id} type="button" className="search-result" onClick={() => focusGraphNode(node.id)}>
                        <span className="search-result-title">{node.paper.title}</span>
                        <span className="search-result-meta">
                          {[formatPaperStatus(metadata.status), tags[0], tldr].filter(Boolean).join(" / ") || "暂无摘要信息"}
                        </span>
                        <LocateFixed size={15} />
                      </button>
                    );
                  })
                ) : (
                  <div className="search-empty">没有匹配结果</div>
                )}
                {searchResults.length > maxSearchResults ? (
                  <div className="search-more">还有 {searchResults.length - maxSearchResults} 个结果，继续输入可缩小范围</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
        {nodes.length === 0 ? (
          <div className="empty-hint">
            <strong>还没有文献</strong>
            <span>从第一篇资料开始建立你的研究脉络。</span>
          </div>
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={graphEdges}
          nodeTypes={nodeTypes}
          nodesDraggable={!layoutMutation.isPending}
          onNodesChange={(changes: NodeChange<Node<PaperNodeData>>[]) => {
            if (changes.some((change) => change.type === "position" && change.dragging)) {
              setDraggingNode(true);
            }
            onNodesChange(changes);
          }}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          onInit={setFlowInstance}
          fitView
          minZoom={0.35}
          maxZoom={1.8}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} />
          <Controls position="bottom-left" />
          <MiniMap position="bottom-right" pannable zoomable />
        </ReactFlow>
      </main>
      <CreateNodeDialog
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload) => createMutation.mutate(payload)}
        isCreating={createMutation.isPending}
      />
      <EditNodeDialog
        open={Boolean(editingCanvasNodeId)}
        paper={editPaperQuery.data ?? null}
        isLoading={editPaperQuery.isLoading || incomingRelationsQuery.isLoading}
        isSaving={updateNodeMutation.isPending}
        onClose={() => setEditingCanvasNodeId(null)}
        availablePapers={graphQuery.data?.nodes.map((node) => node.paper) ?? []}
        relationLabels={graphQuery.data?.relation_labels ?? []}
        incomingRelationGroups={incomingRelationsQuery.data?.groups ?? []}
        onSave={(payload) => updateNodeMutation.mutate(payload)}
      />
      <RelationLabelsDialog
        open={isRelationSettingsOpen}
        labels={graphQuery.data?.relation_labels ?? []}
        onClose={() => setRelationSettingsOpen(false)}
        onCreate={(payload) => createRelationLabelMutation.mutate(payload)}
        onUpdate={(labelId, value) => updateRelationLabelMutation.mutate({ labelId, value })}
        onDelete={(labelId) => deleteRelationLabelMutation.mutate(labelId)}
        isMutating={
          createRelationLabelMutation.isPending ||
          updateRelationLabelMutation.isPending ||
          deleteRelationLabelMutation.isPending
        }
      />
      <DeleteNodeDialog
        open={Boolean(deletingGraphNode)}
        title={deletingGraphNode?.paper.title ?? ""}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setDeletingCanvasNodeId(null)}
        onConfirm={() => {
          if (deletingGraphNode) {
            deleteMutation.mutate(deletingGraphNode.paper_id);
          }
        }}
      />
      <AlertDialog open={Boolean(errorMessage)} title="未能完成操作" message={errorMessage ?? ""} onConfirm={clearErrorMessage} />
    </div>
  );
}
