import { NetworkNode } from "./NetworkNode";
import { Port, PortSide } from "./Ports";

type MacAddress = [number, number, number, number, number, number];

export function formatMAC(address: MacAddress) {
    return address.map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
}

export class NIC {

    private static nextId: number = 0;
    id: number;

    mac: MacAddress;

    ports: Port[] = [];
    node: NetworkNode;

    constructor(node: NetworkNode) {
        this.node = node;
        this.id = NIC.nextId++;
        
        this.mac = [
            0x06, 
            0xCA, 
            0xFE, 
            ((this.id >> 16) & 0xFF) ^ 0x8A,
            ((this.id >> 8) & 0xFF) ^ 0x25,
            (this.id & 0xFF) ^ 0xC1,
        ];
    }

    addPort(side: PortSide): Port {
        const port = new Port(this, side);
        this.ports.push(port);
        this.node.adjustPortsOnSide(side);
        return port;
    }

    send() {
        // TODO: if there is more than one port, use ARP Table (switches only)
        this.ports[0].send();
    }
}