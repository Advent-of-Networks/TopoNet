import { NIC } from "./NIC";
import { IPConfig } from "./types";

export class Iface {

    private static nextId = 0;

    id: number;

    nic: NIC;
    ips: IPConfig[] = [];

    constructor(nic: NIC) {
        this.nic = nic;
        this.id = Iface.nextId++;
    }

}