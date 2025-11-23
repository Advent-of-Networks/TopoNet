import { Emulation } from "../engine/Emulation";
import { EthernetFrame, EthernetFrameType } from "./EthernetFrame";
import { NetworkNode } from "./NetworkNode";
import { Port } from "./Ports";
import { TransitUnit } from "./TransitUnit";
import { Direction, MacAddress } from "./types";

export function formatMAC(address: MacAddress) {
    return address.map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
}

export class NIC {

    private static nextId: number = 0;
    id: number;

    emulation: Emulation;

    mac: MacAddress;

    ports: Port[] = [];
    node: NetworkNode;

    queue: EthernetFrame[] = [];
    sendingTransitUnit: TransitUnit | null = null;

    forward: boolean = false;

    constructor(emulation: Emulation, node: NetworkNode) {
        this.node = node;
        this.id = NIC.nextId++;

        this.emulation = emulation;
        
        this.mac = [
            0x06, 
            0xCA, 
            0xFE, 
            ((this.id >> 16) & 0xFF) ^ 0x8A,
            ((this.id >> 8) & 0xFF) ^ 0x25,
            (this.id & 0xFF) ^ 0xC1,
        ];
    }

    addPort(side: Direction): Port {
        const port = new Port(this.emulation, this, side);
        this.ports.push(port);
        this.node.adjustPortsOnSide(side);
        return port;
    }

    update(deltaT: number) {
        if (!this.sending() && this.queue.length > 0) {
            this.ports[0].send(this.queue.pop()!);
        }
        for(const port of this.ports) {
            port.update(deltaT);
        }
    }

    send(dstMac: MacAddress) {
        const frame = new EthernetFrame(dstMac, this.mac,EthernetFrameType.EXPERIMENTAL1);
        // TODO: if there is more than one port, use ARP Table (switches only)
        this.queue.unshift(frame);
    }

    sending() {
        for (const port of this.ports) {
            if (port.sending()) return true;
        }
        return false;
    }

    corrupt() {
        for (const port of this.ports) {
            port.corrupt();
        }
    }

    jam() {
        for (const port of this.ports) {
            port.jam();
        }
    }

    receive(transmitUnit: TransitUnit) {
        const {payload} = transmitUnit;
        if (this.forward) {
            if(this.sending()) {
                // Collision
                this.corrupt();
                this.jam();
            } else {
                for (const port of this.ports) {
                    const receiver = transmitUnit.forward ? transmitUnit.connection.to : transmitUnit.connection.from;
                    if (port === receiver) continue;
                    port.send(payload);
                }
            }
        }
    }
}