import { Emulation } from "../engine/Emulation";
import { GUIInterface } from "../guiComponents/GUIInterface";
import { GUINetworkNode } from "../guiComponents/GUINetworkNode";
import { NetworkNode } from "./NetworkNode";
import { NIC } from "./NIC";
import { IPConfig } from "./types";

export class Iface extends GUIInterface {

    nic: NIC;
    ips: IPConfig[] = [];

    constructor(emulation: Emulation, node: NetworkNode) {
        super(node, emulation);
        this.nic = new NIC(emulation, this);
    }

}