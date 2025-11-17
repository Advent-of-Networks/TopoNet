
import { Port, PortSide } from "./components/Ports";
import { Connection } from "./components/Connection";
import { NetworkNode } from "./components/NetworkNode";
import { Emulation } from "./engine/Emulation";

const emulation = new Emulation();

for (const node of [
    new NetworkNode(-100, -100),
    new NetworkNode(100, -100),
    new NetworkNode(300, 0),
    new NetworkNode(100, 100),
]) {
    emulation.nodes.push(node);
}

emulation.ports.push(emulation.nodes[0].addPort(PortSide.EAST));
emulation.ports.push(emulation.nodes[0].addPort(PortSide.EAST));
emulation.ports.push(emulation.nodes[0].addPort(PortSide.EAST));
emulation.ports.push(emulation.nodes[1].addPort(PortSide.WEST));
emulation.ports.push(emulation.nodes[1].addPort(PortSide.WEST));
emulation.ports.push(emulation.nodes[1].addPort(PortSide.EAST));
emulation.ports.push(emulation.nodes[2].addPort(PortSide.NORTH));
emulation.ports.push(emulation.nodes[2].addPort(PortSide.WEST));
emulation.ports.push(emulation.nodes[3].addPort(PortSide.WEST));
emulation.ports.push(emulation.nodes[3].addPort(PortSide.WEST));

for (const connection of [
    new Connection(emulation.ports[0], emulation.ports[3]),
    new Connection(emulation.ports[1], emulation.ports[7]),
    new Connection(emulation.ports[2], emulation.ports[9]),
    new Connection(emulation.ports[4], emulation.ports[8]),
    new Connection(emulation.ports[5], emulation.ports[6]),
]) {
    emulation.connections.push(connection);
}

emulation.start();