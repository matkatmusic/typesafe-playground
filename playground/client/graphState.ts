export interface GraphState {
  averageShownByName: Record<string, boolean>;
  collapsedByName: Record<string, boolean>;
}

export const graphState: GraphState = { averageShownByName: {}, collapsedByName: {} };
