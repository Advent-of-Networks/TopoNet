import { Emulation } from "../engine/Emulation";
import { Iface } from "./Iface";
import { NetworkNode } from "./NetworkNode";
import { NIC } from "./NIC";
import { Direction } from "./types";


export class Hub extends NetworkNode {

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation, name, x, y, width, height, labelDirection);
        this.addInterface(new Iface(new NIC(this.emulation, this)));
        this.interfaces[0].nic.forward = true;
        this.interfaces[0].nic.mac = [0,0,0,0,0,0];
    }

    update(deltaT: number) {
        for(const iface of this.interfaces) {
            iface.update(deltaT);
        }
    }

}