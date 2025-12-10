import { NetworkNode } from "../components/NetworkNode";
import { NIC } from "../components/NIC";
import { Emulation } from "../engine/Emulation";
import { GUIElement } from "./GUIElement";

export class GUIInterface extends GUIElement<NetworkNode, NIC> {

    nic: NIC;

    constructor(emulation: Emulation, node: NetworkNode, nicFactory: (emulation: Emulation, Interface: GUIInterface) => NIC) {
        super(node, emulation);
        this.nic = nicFactory(emulation, this);
    }
}