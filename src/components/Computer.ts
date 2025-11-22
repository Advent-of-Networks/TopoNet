import { Emulation } from "../engine/Emulation";
import { NetworkNode } from "./NetworkNode";
import { Direction } from "./types";

export class Computer extends NetworkNode {

    hostname: string;

    constructor(emulation: Emulation, hostname: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation,hostname, x, y, width, height, labelDirection);
        this.hostname = hostname;
    }

}