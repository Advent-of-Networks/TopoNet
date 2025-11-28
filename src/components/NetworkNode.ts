import { Emulation } from "../engine/Emulation";
import { GUINetworkNode } from "../guiComponents/GUINetworkNode";
import { Iface } from "./Iface";
import { Port } from "./Ports";
import { Direction } from "./types";

export class NetworkNode extends GUINetworkNode {

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation, name, x, y, width, height, labelDirection);
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
                    const dstMac = from === port ? to.getParent()!.mac : from.getParent()!.mac;
                    nic.send(dstMac);
                }
            }
        }
    }

    addInterface() {
        new Iface(this.getEmulation(), this);
    }
    
    getInterfaces() {
        return this.getChildren();
    }
    
}