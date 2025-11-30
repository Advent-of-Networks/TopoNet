import { Emulation } from "../engine/Emulation";
import { GUIInterface } from "../guiComponents/GUIInterface";
import { NetworkNode } from "./NetworkNode";
import { NIC } from "./NIC";
import { IPConfig } from "./types";

export class Iface extends GUIInterface<NIC> {

    ips: IPConfig[] = [];

    constructor(emulation: Emulation, node: NetworkNode) {
        super(emulation, node, (e: Emulation, i: GUIInterface<any>) => new NIC(e, i as Iface));
    }

}