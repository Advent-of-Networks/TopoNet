import { Emulation } from "../engine/Emulation";
import { GUINIC } from "../guiComponents/GUINIC";
import { EthernetFrame, EthernetFrameType } from "./EthernetFrame";
import { Iface } from "./Iface";
import { Port } from "./Ports";
import { TransmitUnit } from "./TransmitUnit";
import { Direction, MacAddress } from "./types";

export function formatMAC(address: MacAddress) {
    return address.map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
}

export class NIC extends GUINIC {

    mac: MacAddress;

    queue: EthernetFrame[] = [];
    sendingTransitUnit: TransmitUnit | null = null;

    forward: boolean = false;

    constructor(emulation: Emulation, iface: Iface) {
        super(iface, emulation);
        const id = this.getID();
        this.mac = [
            0x06, 
            0xCA, 
            0xFE, 
            ((id >> 16) & 0xFF) ^ 0x8A,
            ((id >> 8) & 0xFF) ^ 0x25,
             (id & 0xFF) ^ 0xC1,
        ];
    }

    addPort(side: Direction): Port {
        const port = new Port(this.getEmulation(), this, side);
        this.getParent()!.getParent()!.adjustPortsOnSide(side);
        return port;
    }

    update(deltaT: number) {
        if (!this.sending() && this.queue.length > 0) {
            this.getChildren()[0].send(this.queue.pop()!);
        }
    }

    send(dstMac: MacAddress) {
        const frame = new EthernetFrame(dstMac, this.mac,EthernetFrameType.EXPERIMENTAL1);
        // TODO: if there is more than one port, use ARP Table (switches only)
        this.queue.unshift(frame);
    }

    sending() {
        for (const port of this.getChildren()) {
            if (port.sending()) return true;
        }
        return false;
    }

    corrupt() {
        for (const port of this.getChildren()) {
            port.corrupt();
        }
    }

    jam() {
        for (const port of this.getChildren()) {
            port.jam();
        }
    }

    receive(transmitUnit: TransmitUnit) {
        const {payload} = transmitUnit;
        if (this.forward) {
            const [from, to] = transmitUnit.getParent()!.getPorts();
            const receiver = transmitUnit.forward ? to : from;
            const collision = this.sending();
            // corrupt old TUs
            if(collision) {
                this.corrupt();
            }
            for (const port of this.getChildren()) {
                if (port === receiver) continue;
                port.send(payload);
            }
            // corrupt new TUs
            if(collision) {
                this.corrupt();
            }
        }
    }
}