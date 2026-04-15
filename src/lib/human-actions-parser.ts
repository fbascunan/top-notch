/**
 * Parser for HUMAN-ACTIONS.md markdown tables.
 * Extracts structured action items from the markdown format used in docs/HUMAN-ACTIONS.md.
 */

export interface ParsedHumanAction {
  milestone: string;
  description: string;
  is_blocker: boolean;
  status: "pending" | "done";
}

/**
 * Parse a HUMAN-ACTIONS.md file content into structured action items.
 *
 * Expects sections with `## Milestone Title` headers followed by markdown tables.
 * Table rows have: | Status | Item | Blocker? | Milestone? (optional) |
 *
 * Status: `[ ]` = pending, `[x]` = done
 * Blocker: "BLOCKER" or "post-deploy"
 */
export function parseHumanActions(markdown: string): ParsedHumanAction[] {
  const actions: ParsedHumanAction[] = [];
  const lines = markdown.split("\n");

  let currentMilestone = "";

  for (const line of lines) {
    // Detect section headers like "## M19 — Run History Schema" or "## From Previous Milestones"
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      const sectionTitle = sectionMatch[1].trim();
      // Extract milestone number from section title (e.g. "M19 — ..." → "M19")
      const milestoneMatch = sectionTitle.match(/^(M\d+)/);
      if (milestoneMatch) {
        currentMilestone = milestoneMatch[1];
      } else if (sectionTitle.startsWith("From Previous")) {
        // Will use per-row milestone column
        currentMilestone = "";
      } else if (sectionTitle === "How to Use This File") {
        // Stop parsing at the instructions section
        break;
      }
      continue;
    }

    // Parse table rows: | Status | Item | Blocker? | Milestone? |
    // Skip header/separator rows
    if (!line.startsWith("|") || line.includes("---") || line.includes("Status")) continue;

    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;

    const statusCell = cells[0];
    const itemCell = cells[1];
    const blockerCell = cells[2];
    // Some tables have a 4th column for milestone (the "From Previous" section)
    const milestoneCell = cells.length >= 4 ? cells[3] : "";

    const isDone = statusCell.includes("[x]");
    const isBlocker = blockerCell.toUpperCase().includes("BLOCKER");

    // Determine milestone — use per-row column if available, otherwise section header
    let milestone = currentMilestone;
    if (milestoneCell) {
      const rowMilestone = milestoneCell.match(/(M\d+)/);
      if (rowMilestone) {
        milestone = rowMilestone[1];
      }
    }

    // Clean description: remove markdown bold markers
    const description = itemCell.replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (!description) continue;

    actions.push({
      milestone: milestone || "General",
      description,
      is_blocker: isBlocker,
      status: isDone ? "done" : "pending",
    });
  }

  return actions;
}
