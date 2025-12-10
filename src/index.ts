import { PacketSentEvent, Port } from "./components/Ports";
import { Connection } from "./components/Connection";
import { Emulation, NodeClickedEvent, PacketMode, PauseEvent } from "./engine/Emulation";
import { UIWindow } from "./engine/ui/window";
import { HUD, HUDButton } from "./engine/ui/HUD";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { faCog, faPause, faPlay, faProjectDiagram, faStepForward } from "@fortawesome/free-solid-svg-icons";
import { formatMAC } from "./components/NIC";
import { ethernetFrameTypeNames } from "./components/EthernetFrame";
import { Computer } from "./components/Computer";
import { Direction } from "./components/types";
import { Hub } from "./components/Hub";
import { Transmission } from "./components/Transmission";



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
            new Hub(this.emulation, "Hub", 0, -75, 50, 50, Direction.NORTH),
            new Computer(this.emulation, "Pete-PC", -100, 75),
            new Computer(this.emulation, "Webserver", 0, 75),
            new Computer(this.emulation, "Monica-PC", 100, 75),
        ]) {
            this.emulation.nodes.push(node);
        }


        const ports: Port[] = [];

        this.emulation.nodes[1].addInterface();
        this.emulation.nodes[2].addInterface();
        this.emulation.nodes[3].addInterface();

        ports.push(this.emulation.nodes[0].getInterfaces()[0].nic.addPort(Direction.SOUTH));
        ports.push(this.emulation.nodes[0].getInterfaces()[0].nic.addPort(Direction.SOUTH));
        ports.push(this.emulation.nodes[0].getInterfaces()[0].nic.addPort(Direction.SOUTH));

        ports.push(this.emulation.nodes[1].getInterfaces()[0].nic.addPort(Direction.NORTH));
        ports.push(this.emulation.nodes[2].getInterfaces()[0].nic.addPort(Direction.NORTH));
        ports.push(this.emulation.nodes[3].getInterfaces()[0].nic.addPort(Direction.NORTH));

        for (const connection of [
            new Connection(this.emulation, ports[0], ports[3]),
            new Connection(this.emulation, ports[1], ports[4]),
            new Connection(this.emulation, ports[2], ports[5]),
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
                            <h2>Simulator</h2>
                            <select id="packet-mode">
                                <option value=${PacketMode.LOGICAL} ${this.emulation.packetMode === PacketMode.LOGICAL && "selected"}>Logical</option>
                                <option value=${PacketMode.PHYSICAL} ${this.emulation.packetMode === PacketMode.PHYSICAL && "selected"}>Physical</option>
                            </select>
                            <h2>Debug</h2>
                            <p>Enable: <input id="debug-mode" type="checkbox" ${this.emulation.debugMode && 'checked'} /></p>
                            <p>Laser Pointer: <input id="laserpointer" type="checkbox" ${this.emulation.laserPointer && 'checked'} /></p>
                        </div>
                    `
                );
                settingsWindow.addEventListener("close", () => {settingsWindow = null});
                const content = settingsWindow.getContent();
                const packetMode = content?.shadowRoot?.querySelector("#packet-mode");
                packetMode?.addEventListener("change", (e) => {
                    const target = e.target as HTMLSelectElement;
                    this.emulation.packetMode = parseInt(target.value) as PacketMode;
                })
                const debugModeBox = content?.shadowRoot?.querySelector("#debug-mode");
                debugModeBox?.addEventListener("change", (e) => {
                    const target = e.target as HTMLInputElement;
                    this.emulation.debugMode = target.checked;
                });
                const laserPointerBox = content?.shadowRoot?.querySelector("#laserpointer");
                laserPointerBox?.addEventListener("change", (e) => {
                    const target = e.target as HTMLInputElement;
                    this.emulation.laserPointer = target.checked;
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
        let units: Transmission[] = [];
        const netlensIcon = icon(faProjectDiagram).node[0] as SVGElement;
        const packet2entry = (p: Transmission) => (`
                <td>${p.getID()}</td>
                <td>${formatMAC(p.getChild()!.payload!.srcMac)}</td>
                <td>${formatMAC(p.getChild()!.payload!.dstMac)}</td>
                <td>${ethernetFrameTypeNames[p.getChild()!.payload!.type]}</td>
            `);
        const netlensButton = new HUDButton(netlensIcon, (e) => {
            if (!netlensWindow) {
                netlensWindow = new UIWindow(this, "NetLens");
                const unitlist = units.filter((p) => p.getChild()!.payload).map(p => `<tr>${packet2entry(p)}</tr>`).join("");
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
                    const { transmission } = (e as PacketSentEvent).detail;
                    const entry = document.createElement("tr");
                    entry.innerHTML = packet2entry(transmission);
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
            const { transmission } = (e as PacketSentEvent).detail;
            units.push(transmission);
        });

        let nodeWindows: (UIWindow | null)[] = [];
        this.emulation.addEventListener("onNodeClick", (e) => {
            const {node} = (e as NodeClickedEvent).detail;
            if (!nodeWindows[node.getID()]) {
                nodeWindows[node.getID()] = new UIWindow(this, `${node.getName()}`);
                // TODO: this can be optimized to one iteration.
                const ifacelist = node.getInterfaces().map(i => (
                    `
                        <tr>
                            <td>${i.getID()}</td>
                            <td>${i.nic.getID()}</td>
                        </tr>
                    `
                )).join("");
                const niclist = node.getInterfaces().map(i => (
                    `
                        <tr>
                            <td>${i.nic.getID()}</td>
                            <td>${formatMAC(i.nic.mac)}</td>
                        </tr>
                    `
                )).join("");
                const portList = node.getInterfaces().map(i => (
                    i.nic.getChildren().map(p => (
                        `
                            <tr>
                                <td>${p.getID()}</td>
                                <td>${p.side}</td>
                                <td>${p.getConnection() ? `<span style="color: #60C851">Connected</span>` : `<span style="color: #F24848">Disconnected</span>`}</td>
                                <td>${p.getDuplex()}</td>
                                <td>${p.getDuplexCapability()}</td>
                            </tr>
                        `
                    )).join("")
                )).join("");
                
                nodeWindows[node.getID()]!.setContent(
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
                            <h1>${node.getName()}</h1>
                            <h2>Host:</h2>
                            <p>
                                <button id="send_button">Send Packet</button>
                            </p>
                            <table>
                                <tr>
                                    <td>Hostname: </td>
                                    <td>${node.getName()}</td>
                                </tr>
                            </table>
                            <h3>Interfaces</h3>
                            <table class="table">
                                <tr>
                                    <th>#</th>
                                    <th>NIC</th>
                                </tr>
                                ${ifacelist}
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
                                    <th>Duplex Mode</th>
                                    <th>Duplex Capa</th>
                                </tr>
                                ${portList}
                            </table>
                        </div>
                    `
                );
                nodeWindows[node.getID()]!.addEventListener("close", () => {nodeWindows[node.getID()] = null});
                const content = nodeWindows[node.getID()]!.getContent();
                const sendButton = content?.shadowRoot?.querySelector("#send_button");
                sendButton?.addEventListener("click", (e) => {
                    // const target = e.target as HTMLSelectElement;
                    // this.emulation.packetMode = parseInt(target.value) as PacketMode;
                    const nic = node.getChild()?.getChild()?.send([0,0,0,0,0,0]);
                })
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

// const welcome = new UIWindow(toponet, "Welcome");
// welcome.setContent(
//     `
//         <style>
//             .center {
//                 display: flex;
//                 flex-direction: column;
//                 text-align: center;
//                 padding: 10px;
//             }
//         </style>
//         <div class="center">
//             <h1>Welcome to TopoNet</h1>
//             <p>
//                 TopoNet is a web-based networking simulator for educational purposes.
//                 We are currently heavily in development, but expect to be fully functional by the end of 2026.
//                 By the end of 2026 there will also be a big surprise waiting for you. Stay tuned by giving us a star on <a target="_blank" href="https://github.com/Advent-of-Networks/TopoNet">GitHub</a>
//             </p>
//         </div>
//     `
// );
// welcome.addEventListener("close", () => {});