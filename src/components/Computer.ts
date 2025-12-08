import { Emulation } from "../engine/Emulation";
import { NetworkNode } from "./NetworkNode";
import { Direction } from "./types";

export class Computer extends NetworkNode {

    hostname: string;

    constructor(emulation: Emulation, hostname: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation,hostname, x, y, width, height, labelDirection);
        this.hostname = hostname;
    }

    update(deltaT: number) {
        const p = 6 * deltaT / 50;
        for(const iface of this.getChildren()) {
            const nic = iface.nic;
            if (Math.random() < p) {
                const port = nic.getChild();
                const connection = port?.getChild();
                if (connection) {
                    const [from, to] = connection.getPorts();
                    if (!from || !to) continue;
                    const dstMac = from === port ? to.getParent()!.mac : from.getParent()!.mac;
                    nic.send(dstMac);
                }
            }
        }
    }

}