import type { Edge, Node } from "@xyflow/react";
import { defaultNodeHeight, defaultNodeWidth } from "./edgeRouting";

export type LayoutPosition = {
  id: string;
  x: number;
  y: number;
};

type SizedNode = {
  id: string;
  width: number;
  height: number;
};

const rankGap = 96;
const nodeGap = 48;
const componentGap = 96;
const layoutMargin = 40;

function findWeakComponents(nodeIds: string[], undirected: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  nodeIds.forEach((startId) => {
    if (visited.has(startId)) {
      return;
    }
    const component: string[] = [];
    const stack = [startId];
    visited.add(startId);
    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      component.push(nodeId);
      [...(undirected.get(nodeId) ?? [])]
        .sort((left, right) => right.localeCompare(left))
        .forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            stack.push(neighborId);
          }
        });
    }
    components.push(component.sort((left, right) => left.localeCompare(right)));
  });

  return components;
}

function findStronglyConnectedComponents(nodeIds: string[], outgoing: Map<string, Set<string>>): string[][] {
  const nodeIdSet = new Set(nodeIds);
  let nextIndex = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  function visit(nodeId: string) {
    indices.set(nodeId, nextIndex);
    lowLinks.set(nodeId, nextIndex);
    nextIndex += 1;
    stack.push(nodeId);
    onStack.add(nodeId);

    [...(outgoing.get(nodeId) ?? [])]
      .filter((targetId) => nodeIdSet.has(targetId))
      .sort((left, right) => left.localeCompare(right))
      .forEach((targetId) => {
        if (!indices.has(targetId)) {
          visit(targetId);
          lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, lowLinks.get(targetId)!));
        } else if (onStack.has(targetId)) {
          lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, indices.get(targetId)!));
        }
      });

    if (lowLinks.get(nodeId) !== indices.get(nodeId)) {
      return;
    }
    const component: string[] = [];
    let memberId: string;
    do {
      memberId = stack.pop()!;
      onStack.delete(memberId);
      component.push(memberId);
    } while (memberId !== nodeId);
    components.push(component.sort((left, right) => left.localeCompare(right)));
  }

  nodeIds.forEach((nodeId) => {
    if (!indices.has(nodeId)) {
      visit(nodeId);
    }
  });
  return components;
}

function assignRanks(componentNodeIds: string[], outgoing: Map<string, Set<string>>): Map<string, number> {
  const stronglyConnected = findStronglyConnectedComponents(componentNodeIds, outgoing);
  const componentByNode = new Map<string, number>();
  stronglyConnected.forEach((component, componentIndex) => {
    component.forEach((nodeId) => componentByNode.set(nodeId, componentIndex));
  });

  const componentEdges = stronglyConnected.map(() => new Set<number>());
  const indegrees = stronglyConnected.map(() => 0);
  componentNodeIds.forEach((sourceId) => {
    const sourceComponent = componentByNode.get(sourceId)!;
    (outgoing.get(sourceId) ?? []).forEach((targetId) => {
      const targetComponent = componentByNode.get(targetId);
      if (targetComponent === undefined || targetComponent === sourceComponent || componentEdges[sourceComponent].has(targetComponent)) {
        return;
      }
      componentEdges[sourceComponent].add(targetComponent);
      indegrees[targetComponent] += 1;
    });
  });

  const componentRanks = stronglyConnected.map(() => 0);
  const queue = indegrees
    .map((indegree, index) => ({ indegree, index }))
    .filter(({ indegree }) => indegree === 0)
    .map(({ index }) => index)
    .sort((left, right) => stronglyConnected[left][0].localeCompare(stronglyConnected[right][0]));

  while (queue.length > 0) {
    const componentIndex = queue.shift()!;
    [...componentEdges[componentIndex]]
      .sort((left, right) => stronglyConnected[left][0].localeCompare(stronglyConnected[right][0]))
      .forEach((targetIndex) => {
        componentRanks[targetIndex] = Math.max(componentRanks[targetIndex], componentRanks[componentIndex] + 1);
        indegrees[targetIndex] -= 1;
        if (indegrees[targetIndex] === 0) {
          queue.push(targetIndex);
          queue.sort((left, right) => stronglyConnected[left][0].localeCompare(stronglyConnected[right][0]));
        }
      });
  }

  return new Map(
    componentNodeIds.map((nodeId) => [nodeId, componentRanks[componentByNode.get(nodeId)!]])
  );
}

export function calculateGraphLayout(nodes: Node[], edges: Edge[]): LayoutPosition[] {
  const sizedNodes = new Map<string, SizedNode>(
    nodes.map((node) => [
      node.id,
      {
        id: node.id,
        width: node.measured?.width ?? defaultNodeWidth,
        height: node.measured?.height ?? defaultNodeHeight
      }
    ])
  );
  const nodeIds = [...sizedNodes.keys()].sort((left, right) => left.localeCompare(right));
  const outgoing = new Map(nodeIds.map((nodeId) => [nodeId, new Set<string>()]));
  const incoming = new Map(nodeIds.map((nodeId) => [nodeId, new Set<string>()]));
  const undirected = new Map(nodeIds.map((nodeId) => [nodeId, new Set<string>()]));

  edges.forEach((edge) => {
    if (!sizedNodes.has(edge.source) || !sizedNodes.has(edge.target)) {
      return;
    }
    outgoing.get(edge.source)!.add(edge.target);
    incoming.get(edge.target)!.add(edge.source);
    undirected.get(edge.source)!.add(edge.target);
    undirected.get(edge.target)!.add(edge.source);
  });

  const positions = new Map<string, LayoutPosition>();
  let componentTop = layoutMargin;
  findWeakComponents(nodeIds, undirected).forEach((componentNodeIds) => {
    const ranks = assignRanks(componentNodeIds, outgoing);
    const nodesByRank = new Map<number, SizedNode[]>();
    componentNodeIds.forEach((nodeId) => {
      const rank = ranks.get(nodeId) ?? 0;
      const rankNodes = nodesByRank.get(rank) ?? [];
      rankNodes.push(sizedNodes.get(nodeId)!);
      nodesByRank.set(rank, rankNodes);
    });

    const orderByNode = new Map<string, number>();
    const sortedRanks = [...nodesByRank.keys()].sort((left, right) => left - right);
    sortedRanks.forEach((rank) => {
      const rankNodes = nodesByRank.get(rank)!;
      const barycenterByNode = new Map(
        rankNodes.map((node) => {
          const orders = [...(incoming.get(node.id) ?? [])]
            .map((sourceId) => orderByNode.get(sourceId))
            .filter((order): order is number => order !== undefined);
          const barycenter = orders.length > 0
            ? orders.reduce((total, order) => total + order, 0) / orders.length
            : Number.POSITIVE_INFINITY;
          return [node.id, barycenter] as const;
        })
      );
      rankNodes.sort((left, right) => {
        const difference = barycenterByNode.get(left.id)! - barycenterByNode.get(right.id)!;
        return Number.isFinite(difference) && difference !== 0 ? difference : left.id.localeCompare(right.id);
      });
      rankNodes.forEach((node, index) => orderByNode.set(node.id, index));
    });

    const columnWidths = new Map(
      sortedRanks.map((rank) => [rank, Math.max(...nodesByRank.get(rank)!.map((node) => node.width))])
    );
    const columnHeights = new Map(
      sortedRanks.map((rank) => {
        const rankNodes = nodesByRank.get(rank)!;
        return [rank, rankNodes.reduce((total, node) => total + node.height, 0) + nodeGap * Math.max(0, rankNodes.length - 1)];
      })
    );
    const componentHeight = Math.max(...columnHeights.values(), defaultNodeHeight);
    let columnLeft = layoutMargin;

    sortedRanks.forEach((rank) => {
      const columnWidth = columnWidths.get(rank)!;
      let nodeTop = componentTop + (componentHeight - columnHeights.get(rank)!) / 2;
      nodesByRank.get(rank)!.forEach((node) => {
        positions.set(node.id, {
          id: node.id,
          x: Math.round(columnLeft + (columnWidth - node.width) / 2),
          y: Math.round(nodeTop)
        });
        nodeTop += node.height + nodeGap;
      });
      columnLeft += columnWidth + rankGap;
    });

    componentTop += componentHeight + componentGap;
  });

  return nodes.map((node) => positions.get(node.id) ?? { id: node.id, x: node.position.x, y: node.position.y });
}
