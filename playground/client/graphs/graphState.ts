export interface GraphState {
    averageShownByName: Record<string, boolean>;
    collapsedByName: Record<string, boolean>;
    isReferencesReplaced: boolean;
}

export class graphState {
    public static averageShownByName: Record<string, boolean> = {};
    public static collapsedByName: Record<string, boolean> = {};
    public static isReferencesReplaced = false;
    private static instance: graphState | undefined;

    private constructor() {}

    public static getInstance(): graphState {
        if (graphState.instance === undefined) {
            graphState.instance = new graphState();
        }
        return graphState.instance;
    }
}
