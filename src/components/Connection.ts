import { Emulation } from "../engine/Emulation";
import { DraggingPoint, GUIConnection } from "../guiComponents/GUIConnection";
import { Port } from "./Ports";
import { Transmission } from "./Transmission";

export class Connection extends GUIConnection {

    delay: number = 0.003; // v=180.000.000m/s and l=500m ~> d~=3us
    private speed: number = 10_000_000; // 10 Mbps (10BaseT)

    constructor(emulation: Emulation, from: Port | null, to: Port | null) {
        super(emulation);
        this.addParent(from);
        this.addParent(to);
        if (!to) this.draggingPoint = DraggingPoint.End;
    }

    removeTransmission(transmission: Transmission) {
        this.removeChild(transmission);
    }

    getSpeedBpms() {
        return this.speed/1000;
    }

    getPorts() {
        return this.getParents();
    }
}