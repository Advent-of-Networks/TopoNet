import { PacketSentEvent, Port, PortSide } from "./components/Ports";
import { Connection } from "./components/Connection";
import { NetworkNode } from "./components/NetworkNode";
import { Emulation, NodeClickedEvent, PauseEvent } from "./engine/Emulation";
import { UIWindow } from "./engine/ui/window";
import { HUD, HUDButton } from "./engine/ui/HUD";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { faCog, faPause, faPlay, faProjectDiagram, faStepForward } from "@fortawesome/free-solid-svg-icons";
import { formatMAC, NIC } from "./components/NIC";
import { TransitUnit } from "./components/TransitUnit";
import { ethernetFrameTypeNames } from "./components/EthernetFrame";



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
            new NetworkNode(this.emulation, "Peter-PC", -100, -100),
            new NetworkNode(this.emulation, "WebServer", 100, -100),
            new NetworkNode(this.emulation, "DNSServer", 300, 0),
            new NetworkNode(this.emulation, "Monica-PC", 100, 100),
            new NetworkNode(this.emulation, "Phil-PC", 50, 50),
        ]) {
            this.emulation.nodes.push(node);
        }


        const ports: Port[] = [];

        this.emulation.nodes[0].addNIC(new NIC(this.emulation, this.emulation.nodes[0]));
        this.emulation.nodes[0].addNIC(new NIC(this.emulation, this.emulation.nodes[0]));
        this.emulation.nodes[0].addNIC(new NIC(this.emulation, this.emulation.nodes[0]));
        this.emulation.nodes[1].addNIC(new NIC(this.emulation, this.emulation.nodes[1]));
        this.emulation.nodes[1].addNIC(new NIC(this.emulation, this.emulation.nodes[1]));
        this.emulation.nodes[1].addNIC(new NIC(this.emulation, this.emulation.nodes[1]));
        this.emulation.nodes[2].addNIC(new NIC(this.emulation, this.emulation.nodes[2]));
        this.emulation.nodes[2].addNIC(new NIC(this.emulation, this.emulation.nodes[2]));
        this.emulation.nodes[3].addNIC(new NIC(this.emulation, this.emulation.nodes[3]));
        this.emulation.nodes[3].addNIC(new NIC(this.emulation, this.emulation.nodes[3]));

        this.emulation.nodes[4].addNIC(new NIC(this.emulation, this.emulation.nodes[4]));

        ports.push(this.emulation.nodes[0].nics[0].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[0].nics[1].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[0].nics[2].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[1].nics[0].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[1].nics[1].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[1].nics[2].addPort(PortSide.NORTH));
        ports.push(this.emulation.nodes[2].nics[0].addPort(PortSide.EAST));
        ports.push(this.emulation.nodes[2].nics[1].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[3].nics[0].addPort(PortSide.WEST));
        ports.push(this.emulation.nodes[3].nics[1].addPort(PortSide.WEST));

        ports.push(this.emulation.nodes[4].nics[0].addPort(PortSide.WEST));

        for (const connection of [
            new Connection(ports[1], ports[3]),
            new Connection(ports[0], ports[7]),
            new Connection(ports[2], ports[9]),
            new Connection(ports[4], ports[8]),
            new Connection(ports[5], ports[6]),
        ]) {
            this.emulation.connections.push(connection);
        }


        let settingsWindow: UIWindow | null = null;
        const hud = new HUD(this);
        const settingsIcon = icon(faCog).node[0] as SVGElement;
        const settingsButton = new HUDButton(settingsIcon, (e) => {
            if (!settingsWindow) {
                settingsWindow = new UIWindow(this, "Settings");
                settingsWindow.setContent(
                    `
                        <style>
                            #content {
                                padding: 0px 20px 0px 20px;
                            }
                        </style>
                        <div id="content">
                            <h1>Settings</h1>
                            <h2>Debug</h2>
                            <p>Enable: <input id="debug-mode" type="checkbox" ${this.emulation.debugMode && 'checked'} /></p>
                        </div>
                    `
                );
                settingsWindow.addEventListener("close", () => {settingsWindow = null});
                const content = settingsWindow.getContent();
                const debugModeBox = content?.shadowRoot?.querySelector("#debug-mode");
                debugModeBox?.addEventListener("change", (e) => {
                    const target = e.target as HTMLInputElement;
                    this.emulation.debugMode = target.checked;
                });
            }
        });
        
        const pauseIcon = icon(faPause).node[0] as SVGElement;
        const playIcon = icon(faPlay).node[0] as SVGAElement;
        const pauseButton = new HUDButton(this.emulation.paused ? playIcon : pauseIcon, (e) => {
            this.emulation.togglePause();
        });

        const stepIcon = icon(faStepForward).node[0] as SVGElement;
        const stepButton = new HUDButton(stepIcon, (e) => {
            this.emulation.step();
        });
        stepButton.setDisabled(!this.emulation.paused);


        this.emulation.addEventListener("pause", (e) => {
            const {paused} = (e as PauseEvent).detail;
            pauseButton.setIcon(paused ? playIcon : pauseIcon);
            stepButton.setDisabled(!this.emulation.paused);
        })


        let netlensWindow: UIWindow | null = null;
        let units: TransitUnit[] = [];
        const netlensIcon = icon(faProjectDiagram).node[0] as SVGElement;
        const packet2entry = (p: TransitUnit) => (`
                <td>${p.id}</td>
                <td>${formatMAC(p.frame.srcMac)}</td>
                <td>${formatMAC(p.frame.dstMac)}</td>
                <td>${ethernetFrameTypeNames[p.frame.type]}</td>
            `);
        const netlensButton = new HUDButton(netlensIcon, (e) => {
            if (!netlensWindow) {
                netlensWindow = new UIWindow(this, "NetLens");
                const unitlist = units.map(p => `<tr>${packet2entry(p)}</tr>`).join("");
                netlensWindow.setContent(`
                        <h1>NetLens</h1>
                        <table id="packetlist">
                            <tr>
                                <th>#</th>
                                <th>src MAC</th>
                                <th>dst MAC</th>
                                <th>type</th>
                            </tr>
                            ${unitlist}
                        </table>
                    `);
                const content = netlensWindow.getContent();
                const packetlistTable = content?.shadowRoot?.querySelector("#packetlist");
                const packetSentHandler: EventListener = (e) => {
                    const { transitUnit } = (e as PacketSentEvent).detail;
                    const entry = document.createElement("tr");
                    entry.innerHTML = packet2entry(transitUnit);
                    packetlistTable?.appendChild(entry);
                };
                this.emulation.addEventListener("packetSent", packetSentHandler);
                netlensWindow.addEventListener("close", () => {
                    netlensWindow = null
                    this.emulation.removeEventListener("packetSent", packetSentHandler);
                });
            }
        });

        this.emulation.addEventListener("packetSent", (e) => {
            const { transitUnit } = (e as PacketSentEvent).detail;
            units.push(transitUnit);
        });

        let nodeWindows: (UIWindow | null)[] = [];
        this.emulation.addEventListener("onNodeClick", (e) => {
            const {node} = (e as NodeClickedEvent).detail;
            if (!nodeWindows[node.id]) {
                nodeWindows[node.id] = new UIWindow(this, `Node ${node.id}`);
                const niclist = node.nics.map(n => (
                    `
                        <tr>
                            <td>${n.id}</td>
                            <td>${formatMAC(n.mac)}</td>
                        </tr>
                    `
                )).join("");
                const portList = node.nics.map(n => (
                    n.ports.map(p => (
                        `
                            <tr>
                                <td>${p.id}</td>
                                <td>${p.side}</td>
                                <td>${p.connection ? `<span style="color: #60C851">Connected</span>` : `<span style="color: #F24848">Disconnected</span>`}</td>
                            </tr>
                        `
                    )).join("")
                )).join("");
                
                nodeWindows[node.id]!.setContent(
                    `
                        <style>
                            #content {
                                padding: 0px 20px 20px 20px;
                            }
                            table {
                                border-collapse: collapse;
                            }
                            tr, td, th {
                                border: 1px solid #454545;
                                padding: 10px 20px;
                            }
                            .table th {
                                background: #555555;
                            }
                            .table tr {
                                background: #393939;
                            }
                            .table tr:nth-child(odd) {
                                background: #222222;
                            }
                        </style>
                        <div id="content">
                            <h1>Node ${node.id}</h1>
                            <h2>Host:</h2>
                            <table>
                                <tr>
                                    <td>Hostname: </td>
                                    <td>${node.hostname}</td>
                                </tr>
                            </table>
                            <h2>NICs:</h2>
                            <table class="table">
                                <tr>
                                    <th>#</th>
                                    <th>MAC Address</th>
                                </tr>
                                ${niclist}
                            </table>
                            <h2>Ports:</h2>
                            <table class="table">
                                <tr>
                                    <th>#</th>
                                    <th>Side</th>
                                    <th>State</th>
                                </tr>
                                ${portList}
                            </table>
                        </div>
                    `
                );
                nodeWindows[node.id]!.addEventListener("close", () => {nodeWindows[node.id] = null});
            }
        });
        
        hud.appendButton(pauseButton);
        hud.appendButton(stepButton);
        hud.appendButton(netlensButton);
        hud.appendButton(settingsButton);

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
welcome.addEventListener("close", () => {});