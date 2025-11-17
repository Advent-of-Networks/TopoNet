import { PortSide } from "./components/Ports";
import { Connection } from "./components/Connection";
import { NetworkNode } from "./components/NetworkNode";
import { Emulation } from "./engine/Emulation";
import { UIWindow } from "./engine/ui/window";

customElements.define('ui-window', UIWindow);

export class TopoNet extends HTMLElement {

    private shadow: ShadowRoot;
    private canvas: HTMLCanvasElement;
    private emulation: Emulation;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.canvas = document.createElement('canvas');
        this.emulation = new Emulation(this.canvas);
    }

    connectedCallback() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            canvas {
                width: 100%;
                height: 100%;
                display: block;
                background-color: white;
            }
        `;

        this.shadow.append(style, this.canvas);



        for (const node of [
            new NetworkNode(-100, -100),
            new NetworkNode(100, -100),
            new NetworkNode(300, 0),
            new NetworkNode(100, 100),
        ]) {
            this.emulation.nodes.push(node);
        }

        this.emulation.ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        this.emulation.ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        this.emulation.ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        this.emulation.ports.push(this.emulation.nodes[1].addPort(PortSide.WEST));
        this.emulation.ports.push(this.emulation.nodes[1].addPort(PortSide.WEST));
        this.emulation.ports.push(this.emulation.nodes[1].addPort(PortSide.EAST));
        this.emulation.ports.push(this.emulation.nodes[2].addPort(PortSide.NORTH));
        this.emulation.ports.push(this.emulation.nodes[2].addPort(PortSide.WEST));
        this.emulation.ports.push(this.emulation.nodes[3].addPort(PortSide.WEST));
        this.emulation.ports.push(this.emulation.nodes[3].addPort(PortSide.WEST));

        for (const connection of [
            new Connection(this.emulation.ports[0], this.emulation.ports[3]),
            new Connection(this.emulation.ports[1], this.emulation.ports[7]),
            new Connection(this.emulation.ports[2], this.emulation.ports[9]),
            new Connection(this.emulation.ports[4], this.emulation.ports[8]),
            new Connection(this.emulation.ports[5], this.emulation.ports[6]),
        ]) {
            this.emulation.connections.push(connection);
        }

        this.emulation.start();

        const w = document.createElement("ui-window");
        w.setAttribute("title", "Welcome");
        w.setAttribute("height", "400");
        w.setAttribute("width", "600");
        w.innerHTML = `
            <style>
                .center {
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                    padding: 10px;
                }
            </style>
            <div class="center">
                <h1>Welcome to TopoNet</h1>
                <p>
                    TopoNet is a web-based networking simulator for educational purposes.
                    We are currently heavily in development, but expect to be fully functional by the end of 2026.
                    By the end of 2026 there will also be a big surprise waiting for you. Stay tuned by giving us a star on <a target="_blank" href="https://github.com/Advent-of-Networks/TopoNet">GitHub</a>
                </p>
            </div>
        `;
        w.addEventListener("close", () => {
            this.shadow.removeChild(w);
        });
        this.shadow.appendChild(w);
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.emulation.resize);
    }
}

customElements.define('toponet-element', TopoNet);
