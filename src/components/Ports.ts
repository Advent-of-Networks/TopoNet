
import { EthernetFrame } from "./EthernetFrame";
import { GUIPort } from "../guiComponents/GUIPort";
import { TransmitUnit } from "./TransmitUnit";
import { Connection } from "./Connection";
import { NIC } from "./NIC";
interface PacketSentEventDetails {
    transitUnit: TransmitUnit;
}

export type PacketSentEvent = CustomEvent<PacketSentEventDetails>;

export class Port extends GUIPort<NIC, Connection> {

    sendingTransitUnit: TransmitUnit | null = null;

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
        return this.getChild();
    }

    send(frame: EthernetFrame) {
        const connection = this.getChild();
        if (!connection) return;
        this.sendingTransitUnit = new TransmitUnit(this.getEmulation(), frame, connection, connection.getParent() === this);
        this.getEmulation().emit(new CustomEvent<PacketSentEventDetails>("packetSent", {detail: { transitUnit: this.sendingTransitUnit }}));
    }

    receive(transitUnit: TransmitUnit) {
        this.getParent()!.receive(transitUnit);
    }

}