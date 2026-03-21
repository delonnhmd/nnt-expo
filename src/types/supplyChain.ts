// Step 43: Supply Chain Graph + Bottleneck Opportunity Engine — TypeScript type definitions.
// Auto-generated from app/schemas/supply_chain.py

// ── Step 43: Physical Node Responses ───────────────────────────────────────

export interface SupplyChainNodeStateResponse {
  node_id: string;
  abstract_node: string;
  availability: number;
  region: string;
  region_modifier: number;
  region_adjusted_availability: number;
  reliability_scale: number;
  source: string;
}

export interface SupplyChainBottleneckResponse {
  node_id: string;
  abstract_node: string;
  availability: number;
  severity_label: string;
  affected_baskets: string[];
  affected_jobs: string[];
  reason_summary: string;
  rank: number;
}

export interface BasketSupplyMultiplierResponse {
  basket_type: string;
  supply_multiplier: number;
  cost_pressure_label: string;
  weighted_avg_availability: number;
  primary_bottleneck_node: string | null;
  short_summary: string;
}

export interface JobPressureResponse {
  job_key: string;
  job_pressure_multiplier: number;
  raw_pressure_score: number;
  opportunity_label: string;
  source_bottleneck_nodes: string[];
  short_summary: string;
}

export interface SupplyChainSummaryResponse {
  day: number;
  region: string;
  top_bottleneck_node: string | null;
  most_affected_basket: string | null;
  best_job_opportunity: string | null;
  overall_stress_score: number;
  node_states: SupplyChainNodeStateResponse[];
  bottlenecks: SupplyChainBottleneckResponse[];
  basket_multipliers: BasketSupplyMultiplierResponse[];
  job_pressure: JobPressureResponse[];
  debug_meta?: Record<string, unknown> | null;
}

export interface SupplyChainStoryResponse {
  day: number;
  region: string;
  shortage_story: string;
  bottleneck_highlights: string[];
  basket_impact_notes: string[];
  job_opportunity_hints: string[];
  practical_current_actions: string[];
}
