import { Emulation } from "../engine/Emulation";
import { NetworkNode } from "./NetworkNode";
import { Direction } from "./types";


export class Hub extends NetworkNode {

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation, name, x, y, width, height, labelDirection);
        this.addInterface();
        this.getChildren()[0].nic.forward = true;
        this.getChildren()[0].nic.mac = [0,0,0,0,0,0];
    }

}