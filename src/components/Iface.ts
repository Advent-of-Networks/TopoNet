import { NIC } from "./NIC";
import { IPConfig } from "./types";

export class Iface {

    private static nextId = 0;

    id: number;

    nic: NIC;
    ips: IPConfig[] = [];

    update(deltaT: number) {
        this.nic.update(deltaT);
    }

    constructor(nic: NIC) {
        this.nic = nic;
        this.id = Iface.nextId++;
    }

}