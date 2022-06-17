export default class Graph {
    vertices: string[];
    adjacent: { [key: string]: string[]};
    edges: number;
    constructor() {
        this.vertices = [];
        this.adjacent = {};
        this.edges = 0;
    }

    addVertex(v: string) {
        this.vertices.push(v);
        this.adjacent[v] = [];
    }

    addEdge(v: string, w: string) {
        if (!this.vertices.includes(v)) {
            this.addVertex(v);
        }
        if (!this.vertices.includes(w)) {
            this.addVertex(w);
        }
        this.adjacent[v].push(w);
        this.adjacent[w].push(v);
        this.edges++;
    }


    bfs(root: string, goal: string) {
        let adj = this.adjacent;

        const queue: string[] = [];
        queue.push(root);

        const discovered: { [key: string]: boolean; } = {};
        discovered[root] = true;

        const edges: { [key: string]: number; } = {};
        edges[root] = 0;

        const predecessors:{ [key: string]: string} = {};
        predecessors[root] = "";

        const buildPath = (goal: string, root: string, predecessors: { [key: string]: string}) => {
            const stack = [];
            stack.push(goal);

            let u = predecessors[goal];

            while (u !== root) {
                stack.push(u);
                u = predecessors[u];
            }

            stack.push(root);

            let path = stack.reverse();

            return path;
        };

        while (queue.length) {
            let v = queue.shift();
            if (!v) {
                continue;
            };
            if (v === goal) {
                return {
                    distance: edges[goal],
                    path: buildPath(goal, root, predecessors),
                };
            }

            for (let i = 0; i < adj[v].length; i++) {
                if (!discovered[adj[v][i]]) {
                    discovered[adj[v][i]] = true;
                    queue.push(adj[v][i]);
                    edges[adj[v][i]] = edges[v] + 1;
                    predecessors[adj[v][i]] = v;
                }
            }
        }
        return false;
    }
}
// export default Graph;
