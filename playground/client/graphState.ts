export interface GraphState {
  averageShownByName: Record<string, boolean>;
  collapsedByName: Record<string, boolean>;
  isReferencesReplaced: boolean;
}

export const graphState: GraphState = { averageShownByName: {}, collapsedByName: {}, isReferencesReplaced: false };
