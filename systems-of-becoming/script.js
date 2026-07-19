const ACTIONS = [
  "Write Rules",
  "Introduce Variation",
  "Execute Systems",
  "Evolve Outcomes",
  "Negotiate Authorship"
];

const ACTION_COLORS = {
  "Write Rules": "#173042",
  "Introduce Variation": "#727665",
  "Execute Systems": "#E8B478",
  "Evolve Outcomes": "#D3DFDD",
  "Negotiate Authorship": "#9DD2C7"
};

const TYPE_RADIUS = {
  action: 22,
  artist: 9,
  artist_collective: 10,
  work: 8,
  system: 7,
  technology: 7,
  concept: 7
};

const graphElement = document.getElementById("graph");
const detailPanel = document.getElementById("detailPanel");
const tooltip = document.getElementById("tooltip");
const errorMessage = document.getElementById("errorMessage");
const labelsButton = document.getElementById("labelsButton");
const resetButton = document.getElementById("resetButton");
const legendElement = document.getElementById("legend");
const archiveList = document.getElementById("archiveList");
const searchInput = document.getElementById("searchInput");
const recordCount = document.getElementById("recordCount");

let labelsVisible = true;
let activeNode = null;
let activeAction = null;
let svg;
let zoomBehavior;
let simulation;
let nodeSelection;
let linkSelection;
let labelSelection;
let adjacency;
let nodesById;
let allNodes = [];
let allLinks = [];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeRows(rows) {
  return rows.map(row => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.replace(/^\uFEFF/, "")] = typeof value === "string" ? value.trim() : value;
    }
    return normalized;
  });
}

function buildLegend() {
  legendElement.innerHTML = ACTIONS.map(action => `
    <button class="legend-item" data-action="${escapeHtml(action)}" type="button">
      <span class="legend-swatch" style="background:${ACTION_COLORS[action]}"></span>
      ${escapeHtml(action)}
    </button>
  `).join("");

  legendElement.querySelectorAll(".legend-item").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      activeAction = activeAction === action ? null : action;
      activeNode = null;
      updateLegendState();
      updateArchiveSelection();
      applyHighlight();
    });
  });
}

function updateLegendState() {
  legendElement.querySelectorAll(".legend-item").forEach(button => {
    button.classList.toggle("is-active", button.dataset.action === activeAction);
  });
}

function createAdjacency(links) {
  const map = new Map();
  for (const link of links) {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    if (!map.has(sourceId)) map.set(sourceId, []);
    if (!map.has(targetId)) map.set(targetId, []);
    map.get(sourceId).push({ neighbor: targetId, relationship: link.relationship, link });
    map.get(targetId).push({ neighbor: sourceId, relationship: link.relationship, link });
  }
  return map;
}

function connectedTo(nodeId, candidateId) {
  if (nodeId === candidateId) return true;
  return (adjacency.get(nodeId) || []).some(item => item.neighbor === candidateId);
}

function typeLabel(type = "") {
  return type.replaceAll("_", " ");
}

function nodeCode(index) {
  return String(index + 1).padStart(3, "0");
}

function renderArchiveList(query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = allNodes
    .filter(node => node.type !== "action")
    .filter(node => {
      if (!normalizedQuery) return true;
      return [node.label, node.type, node.primary_action, node.description, node.year]
        .some(value => String(value || "").toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  recordCount.textContent = `${String(filtered.length).padStart(3, "0")} RECORDS`;

  archiveList.innerHTML = filtered.map(node => {
    const originalIndex = allNodes.findIndex(item => item.id === node.id);
    return `
      <button class="archive-item${activeNode?.id === node.id ? " is-selected" : ""}" data-node-id="${escapeHtml(node.id)}" type="button">
        <span class="archive-id">${nodeCode(originalIndex)}</span>
        <span>
          <span class="archive-name">${escapeHtml(node.label)}</span>
          <span class="archive-type">${escapeHtml(typeLabel(node.type))}${node.year ? ` / ${escapeHtml(node.year)}` : ""}</span>
        </span>
        <i class="archive-code" style="color:${ACTION_COLORS[node.primary_action] || "#161616"}"></i>
      </button>
    `;
  }).join("");

  archiveList.querySelectorAll(".archive-item").forEach(button => {
    button.addEventListener("click", () => selectNode(nodesById.get(button.dataset.nodeId)));
  });
}

function updateArchiveSelection() {
  archiveList.querySelectorAll(".archive-item").forEach(button => {
    button.classList.toggle("is-selected", button.dataset.nodeId === activeNode?.id);
  });
}

function selectNode(node) {
  activeAction = null;
  activeNode = activeNode?.id === node.id ? null : node;
  updateLegendState();
  updateArchiveSelection();
  applyHighlight();

  if (activeNode && svg && zoomBehavior && Number.isFinite(activeNode.x) && Number.isFinite(activeNode.y)) {
    const width = graphElement.clientWidth;
    const height = graphElement.clientHeight;
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1.35)
      .translate(-activeNode.x, -activeNode.y);
    svg.transition().duration(600).call(zoomBehavior.transform, transform);
  }
}

function applyHighlight() {
  if (!nodeSelection) return;

  if (activeNode) {
    nodeSelection.classed("dimmed", d => !connectedTo(activeNode.id, d.id));
    linkSelection
      .classed("dimmed", d => d.source.id !== activeNode.id && d.target.id !== activeNode.id)
      .attr("stroke", d => (d.source.id === activeNode.id || d.target.id === activeNode.id) ? "#161616" : null);
    labelSelection.classed("dimmed", d => !connectedTo(activeNode.id, d.id));
    showNodeDetails(activeNode);
    return;
  }

  if (activeAction) {
    nodeSelection.classed("dimmed", d => d.primary_action !== activeAction && d.label !== activeAction);
    linkSelection
      .classed("dimmed", d => {
        const sourceMatches = d.source.primary_action === activeAction || d.source.label === activeAction;
        const targetMatches = d.target.primary_action === activeAction || d.target.label === activeAction;
        return !(sourceMatches && targetMatches);
      })
      .attr("stroke", null);
    labelSelection.classed("dimmed", d => d.primary_action !== activeAction && d.label !== activeAction);
    detailPanel.innerHTML = `
      <p class="record-number">ACTION FILTER</p>
      <div class="record-action" style="background:${ACTION_COLORS[activeAction]}"></div>
      <h2>${escapeHtml(activeAction)}</h2>
      <p>Showing records whose primary action belongs to this generative mechanism. Cross-connections remain visible where the archive overlaps.</p>
      <dl class="record-meta">
        <dt>Mode</dt><dd>Relational filter</dd>
        <dt>Status</dt><dd>Active</dd>
      </dl>
    `;
    return;
  }

  nodeSelection.classed("dimmed", false);
  linkSelection.classed("dimmed", false).attr("stroke", null);
  labelSelection.classed("dimmed", false);
  detailPanel.innerHTML = `
    <div class="record-placeholder">
      <p class="record-number">RECORD / —</p>
      <h2>Select an entry</h2>
      <p>Choose a node or catalogue item to inspect its role, period, description and relational context.</p>
    </div>
  `;
}

function showNodeDetails(node) {
  const connections = (adjacency.get(node.id) || [])
    .map(item => ({ ...item, neighbor: nodesById.get(item.neighbor) }))
    .sort((a, b) => (Number(b.link.weight) || 1) - (Number(a.link.weight) || 1));

  const originalIndex = allNodes.findIndex(item => item.id === node.id);
  const connectionHtml = connections.slice(0, 16).map((item, index) => `
    <div class="connection">
      <span class="connection-index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <strong>${escapeHtml(item.neighbor?.label || item.neighbor)}</strong>
        <span>${escapeHtml(item.relationship || "connected to")}</span>
      </div>
    </div>
  `).join("");

  detailPanel.innerHTML = `
    <p class="record-number">RECORD / ${nodeCode(originalIndex)}</p>
    <div class="record-action" style="background:${ACTION_COLORS[node.primary_action] || "#161616"}"></div>
    <h2>${escapeHtml(node.label)}</h2>
    <p>${escapeHtml(node.description || "No description available.")}</p>
    <dl class="record-meta">
      <dt>Type</dt><dd>${escapeHtml(typeLabel(node.type))}</dd>
      <dt>Action</dt><dd>${escapeHtml(node.primary_action || "Unassigned")}</dd>
      <dt>Period</dt><dd>${escapeHtml(node.year || "Not dated")}</dd>
      <dt>Relations</dt><dd>${connections.length}</dd>
    </dl>
    <div class="connection-title">Relational Index</div>
    ${connectionHtml || "<p>No connections.</p>"}
  `;
}

function nodeRadius(node) {
  return TYPE_RADIUS[node.type] || 7;
}

function actionTagWidth(node) {
  return Math.max(104, Math.min(170, 54 + node.label.length * 7.2));
}

function actionIndex(node) {
  const index = ACTIONS.indexOf(node.label);
  return `A/${String(index + 1).padStart(2, "0")}`;
}

function clusterTarget(action, width, height) {
  const positions = {
    "Write Rules": [width * 0.22, height * 0.28],
    "Introduce Variation": [width * 0.50, height * 0.21],
    "Execute Systems": [width * 0.77, height * 0.35],
    "Evolve Outcomes": [width * 0.65, height * 0.72],
    "Negotiate Authorship": [width * 0.30, height * 0.72]
  };
  return positions[action] || [width / 2, height / 2];
}

function addNodeShape(selection) {
  selection.each(function(d) {
    const group = d3.select(this);
    const r = nodeRadius(d);
    const color = ACTION_COLORS[d.primary_action] || "#161616";

    if (d.type === "action") {
      const width = actionTagWidth(d);
      const height = 32;

      group.append("rect")
        .attr("class", "node-main action-tag")
        .attr("x", -width / 2)
        .attr("y", -height / 2)
        .attr("width", width)
        .attr("height", height)
        .attr("rx", 0)
        .attr("fill", "#f4f1e9")
        .attr("stroke", "#161616")
        .attr("stroke-width", 1.15);

      group.append("rect")
        .attr("class", "action-accent")
        .attr("x", -width / 2)
        .attr("y", -height / 2)
        .attr("width", 7)
        .attr("height", height)
        .attr("fill", color)
        .attr("pointer-events", "none");

      group.append("line")
        .attr("x1", -width / 2 + 39)
        .attr("x2", -width / 2 + 39)
        .attr("y1", -height / 2 + 6)
        .attr("y2", height / 2 - 6)
        .attr("stroke", "rgba(22,22,22,.24)")
        .attr("stroke-width", 1)
        .attr("pointer-events", "none");

      group.append("text")
        .attr("class", "action-code")
        .attr("x", -width / 2 + 13)
        .attr("y", 3.5)
        .text(actionIndex(d));

      group.append("text")
        .attr("class", "action-title")
        .attr("x", -width / 2 + 48)
        .attr("y", 4)
        .text(d.label.toUpperCase());
      return;
    }

    if (d.type === "work") {
      group.append("rect")
        .attr("class", "node-main")
        .attr("x", -r)
        .attr("y", -r)
        .attr("width", r * 2)
        .attr("height", r * 2)
        .attr("fill", "#f4f1e9")
        .attr("stroke", color)
        .attr("stroke-width", 1.6);
      return;
    }

    if (["concept", "technology", "system"].includes(d.type)) {
      group.append("circle")
        .attr("class", "node-main")
        .attr("r", r)
        .attr("fill", "#f4f1e9")
        .attr("stroke", color)
        .attr("stroke-width", 1.6);
      group.append("circle")
        .attr("r", Math.max(1.7, r * .25))
        .attr("fill", color)
        .attr("pointer-events", "none");
      return;
    }

    group.append("circle")
      .attr("class", "node-main")
      .attr("r", r)
      .attr("fill", color)
      .attr("stroke", "#f4f1e9")
      .attr("stroke-width", 1.4);
  });
}

async function initialize() {
  buildLegend();

  try {
    const [rawNodes, rawLinks] = await Promise.all([
      d3.csv("data/nodes.csv"),
      d3.csv("data/edges.csv")
    ]);

    const nodes = normalizeRows(rawNodes);
    const links = normalizeRows(rawLinks).map(link => ({ ...link, weight: Number(link.weight) || 1 }));
    const ids = new Set(nodes.map(node => node.id));
    const brokenLinks = links.filter(link => !ids.has(link.source) || !ids.has(link.target));
    if (brokenLinks.length) throw new Error(`The CSV contains ${brokenLinks.length} invalid relation(s).`);

    allNodes = nodes;
    allLinks = links;
    nodesById = new Map(nodes.map(node => [node.id, node]));
    adjacency = createAdjacency(links);
    renderArchiveList();
    renderGraph(nodes, links);
  } catch (error) {
    console.error(error);
    errorMessage.hidden = false;
    errorMessage.innerHTML = `<strong>Archive failed to load.</strong><br><br>${escapeHtml(error.message)}<br><br>Open the folder with VS Code Live Server.`;
  }
}

function renderGraph(nodes, links) {
  const width = graphElement.clientWidth || 1000;
  const height = graphElement.clientHeight || 720;

  svg = d3.select(graphElement)
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("preserveAspectRatio", "xMidYMid meet");

  svg.append("defs").append("pattern")
    .attr("id", "micro-grid")
    .attr("width", 16)
    .attr("height", 16)
    .attr("patternUnits", "userSpaceOnUse")
    .append("path")
    .attr("d", "M 16 0 L 0 0 0 16")
    .attr("fill", "none")
    .attr("stroke", "rgba(22,22,22,.035)")
    .attr("stroke-width", 1);

  svg.append("rect")
    .attr("class", "graph-background")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#micro-grid)")
    .on("click", () => {
      activeNode = null;
      activeAction = null;
      updateLegendState();
      updateArchiveSelection();
      applyHighlight();
    });

  const zoomLayer = svg.append("g");
  const linkLayer = zoomLayer.append("g");
  const nodeLayer = zoomLayer.append("g");
  const labelLayer = zoomLayer.append("g");

  zoomBehavior = d3.zoom().scaleExtent([0.48, 3.2]).on("zoom", event => zoomLayer.attr("transform", event.transform));
  svg.call(zoomBehavior);

  linkSelection = linkLayer.selectAll("line").data(links).join("line")
    .attr("class", "link")
    .attr("stroke-width", d => .35 + d.weight * .34);

  nodeSelection = nodeLayer.selectAll("g").data(nodes).join("g")
    .attr("class", "node")
    .call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));

  addNodeShape(nodeSelection);

  nodeSelection
    .on("mouseenter", (event, d) => {
      tooltip.style.opacity = 1;
      tooltip.setAttribute("aria-hidden", "false");
      tooltip.innerHTML = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(typeLabel(d.type))}${d.year ? ` / ${escapeHtml(d.year)}` : ""}`;
    })
    .on("mousemove", event => {
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = 0;
      tooltip.setAttribute("aria-hidden", "true");
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      selectNode(d);
    });

  labelSelection = labelLayer.selectAll("text").data(nodes).join("text")
    .attr("class", d => `node-label${d.type === "action" ? " action-label" : ""}`)
    .attr("text-anchor", "middle")
    .attr("dy", d => nodeRadius(d) + 12)
    .text(d => d.type === "action" ? "" : d.label);

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id)
      .distance(d => d.weight >= 3 ? 70 : d.weight === 2 ? 100 : 128)
      .strength(d => d.weight >= 3 ? .64 : .28))
    .force("charge", d3.forceManyBody().strength(d => d.type === "action" ? -520 : -155))
    .force("collision", d3.forceCollide().radius(d => d.type === "action" ? actionTagWidth(d) * .52 : nodeRadius(d) + 12).iterations(2))
    .force("x", d3.forceX(d => clusterTarget(d.primary_action, width, height)[0]).strength(d => d.type === "action" ? .24 : .068))
    .force("y", d3.forceY(d => clusterTarget(d.primary_action, width, height)[1]).strength(d => d.type === "action" ? .24 : .068))
    .force("center", d3.forceCenter(width / 2, height / 2).strength(.025))
    .alphaDecay(.028)
    .on("tick", ticked);

  function ticked() {
    linkSelection
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
    labelSelection.attr("x", d => d.x).attr("y", d => d.y);
  }

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(.25).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }
}

searchInput.addEventListener("input", event => renderArchiveList(event.target.value));

labelsButton.addEventListener("click", () => {
  labelsVisible = !labelsVisible;
  labelsButton.textContent = labelsVisible ? "Labels / On" : "Labels / Off";
  labelsButton.setAttribute("aria-pressed", String(labelsVisible));
  if (labelSelection) labelSelection.style("display", labelsVisible ? null : "none");
});

resetButton.addEventListener("click", () => {
  activeNode = null;
  activeAction = null;
  searchInput.value = "";
  renderArchiveList();
  updateLegendState();
  updateArchiveSelection();
  applyHighlight();
  if (svg && zoomBehavior) svg.transition().duration(600).call(zoomBehavior.transform, d3.zoomIdentity);
  if (simulation) simulation.alpha(.45).restart();
});

initialize();
