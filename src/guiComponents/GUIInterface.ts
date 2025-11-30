import { NetworkNode } from "../components/NetworkNode";
import { Emulation } from "../engine/Emulation";
import { GUIElement } from "./GUIElement";
import { GUINIC } from "./GUINIC";

export class GUIInterface<TNIC extends GUINIC = GUINIC> extends GUIElement<NetworkNode, GUINIC> {

    nic: TNIC;

    constructor(emulation: Emulation, node: NetworkNode, nicFactory: (emulation: Emulation, Interface: GUIInterface<any>) => TNIC) {
        super(node, emulation);
        this.nic = nicFactory(emulation, this);
    }
}