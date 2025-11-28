import { Emulation } from "../engine/Emulation";
import { GUIConnection } from "../guiComponents/GUIConnection";
import { Port } from "./Ports";
import { TransmitUnit } from "./TransmitUnit";

export class Connection extends GUIConnection {
    // TODO: realistic values
    delay: number = 1;
    speed: number = 1000;

    constructor(emulation: Emulation, from: Port, to: Port) {
        super(null, emulation);
        this.addParent(from);
        this.addParent(to);
    }

    removeTransitUnit(transitUnit: TransmitUnit) {
        this.removeChild(transitUnit);
    }

    getPorts() {
        return this.getParents();
    }
}