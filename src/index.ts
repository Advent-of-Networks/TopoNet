import { Port, PortSide } from "./components/Ports";
import { Connection } from "./components/Connection";
import { NetworkNode } from "./components/NetworkNode";
import { Emulation } from "./engine/Emulation";
import { UIWindow } from "./engine/ui/window";



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


        const ports: Port[] = [];

        ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[0].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[1].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[1].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[1].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[2].addPort(PortSide.NORTH));
        ports.push(this.emulation.nodes[2].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[3].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[3].addPort(PortSide.WEST));

        for (const connection of [
            new Connection(ports[0], ports[3]),
            new Connection(ports[1], ports[7]),
            new Connection(ports[2], ports[9]),
            new Connection(ports[4], ports[8]),
            new Connection(ports[5], ports[6]),
        ]) {
            this.emulation.connections.push(connection);
        }

        this.emulation.start();
    }

    removeElement(element: HTMLElement) {
        this.shadow.removeChild(element);
    }

    append(element: HTMLElement) {
        this.shadow.append(element);
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.emulation.resize);
    }
}



if (!customElements.get("toponet-element")) {
    customElements.define('toponet-element', TopoNet);
}


const toponet = document.getElementById("toponet")! as TopoNet;

const welcome = new UIWindow(toponet, "Welcome");
        welcome.setContent(
            `
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
            `
        );