import { Emulation } from "../engine/Emulation";
import { GUIElement } from "../guiComponents/GUIElement";
import { GUINetworkNode } from "../guiComponents/GUINetworkNode";
import { Iface } from "./Iface";
import { Direction } from "./types";

export class NetworkNode extends GUINetworkNode<Iface> {

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(emulation, name, x, y, width, height, labelDirection);
    }

    addInterface() {
        new Iface(this.getEmulation(), this);
    }
    
    getInterfaces() {
        return this.getChildren();
    }
    
}