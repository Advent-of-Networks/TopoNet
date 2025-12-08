
import { EthernetFrame } from "./EthernetFrame";
import { TransmitUnit } from "./TransmitUnit";
import { Connection } from "./Connection";
import { NIC } from "./NIC";
import { Emulation } from "../engine/Emulation";
import { Direction, GUIElementDropEvent } from "./types";
import { GUIPort } from "../guiComponents/GUIPort";
interface PacketSentEventDetails {
    transitUnit: TransmitUnit;
}

export type PacketSentEvent = CustomEvent<PacketSentEventDetails>;

export class Port extends GUIPort {

    sendingTransitUnit: TransmitUnit | null = null;

    constructor(emulation: Emulation, nic: NIC, side: Direction) {
        super(emulation, nic, side);
        this.addEventListener("onDrag", this.onDrag);
        this.addEventListener("onDrop", this.onDrop);
    }

    onDrag(e: Event) {
        if(!this.getChild()) {
            const connection = new Connection(this.getEmulation(), this, null);
            connection.setInteractive(false);
        }
    }
    
    onDrop(e: Event) {
        if (!(e instanceof GUIElementDropEvent)) return;
        const newEvent = new GUIElementDropEvent(e.detail);
        this.getChild()?._ondrop(newEvent);
    }

    update(_deltaT: number) {
        if (this.sending() && this.sendingTransitUnit!.isSent()) {
            this.sendingTransitUnit = null;
        }
    }

    sending() {
        return !!this.sendingTransitUnit;
    }

    corrupt() {
        this.sendingTransitUnit?.corrupt();
    }

    jam() {

    }

    getConnection() {
        const connection = this.getChild();
        if (!connection || !connection.connected()) return null;
        return connection;
    }

    send(frame: EthernetFrame) {
        const connection = this.getConnection();
        if (!connection) return;
        this.sendingTransitUnit = new TransmitUnit(this.getEmulation(), frame, connection, connection.getParent() === this);
        this.getEmulation().emit(new CustomEvent<PacketSentEventDetails>("packetSent", {detail: { transitUnit: this.sendingTransitUnit }}));
    }

    receive(transitUnit: TransmitUnit) {
        this.getParent()!.receive(transitUnit);
    }

}