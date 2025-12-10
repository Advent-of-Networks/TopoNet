
import { Connection } from "./Connection";
import { NIC } from "./NIC";
import { Emulation } from "../engine/Emulation";
import { Direction, Duplex, GUIElementDropEvent } from "./types";
import { GUIElement } from "../guiComponents/GUIElement";
import { Transmission } from "./Transmission";
import { TransmissionUnit } from "./TransmissionUnit";
interface PacketSentEventDetails {
    transmission: Transmission;
}

export type PacketSentEvent = CustomEvent<PacketSentEventDetails>;

export class Port extends GUIElement<NIC, Connection> {

    sendingTransission: Transmission | null = null;
    receivingTransmission: Transmission | null = null;

    side: Direction;

    private duplex: Duplex = Duplex.NONE;
    private duplexCapability: Duplex = Duplex.FULL;

    constructor(emulation: Emulation, nic: NIC, side: Direction) {
        super(nic, emulation, 0, 0, 10, 10);
        if (nic.forward === true) this.duplexCapability = Duplex.HUB;
        this.side = side;

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
        if (this.sending() && this.sendingTransission!.isSent()) {
            this.sendingTransission = null;
        }
        if (this.receiving() && this.receivingTransmission!.isFullyReceived()) {
            this.receivingTransmission = null;
        }
    }

    sending() {
        return !!this.sendingTransission;
    }

    receiving() {
        return !!this.receivingTransmission;
    }

    corrupt() {
        this.sendingTransission?.corrupt();
    }

    jam() {
        this.send(new TransmissionUnit(this.getEmulation(), null));
    }

    getConnection() {
        const connection = this.getChild();
        if (!connection || !connection.connected()) return null;
        return connection;
    }

    send(transmissionUnit: TransmissionUnit) {
        const connection = this.getConnection();
        if (!connection) return;
        this.sendingTransission = new Transmission(this.getEmulation(), transmissionUnit, connection, connection.getParent() === this);
        this.getEmulation().emit(new CustomEvent<PacketSentEventDetails>("packetSent", {detail: { transmission: this.sendingTransission }}));
    }

    receive(transmission: Transmission) {
        this.receivingTransmission = transmission;
        if (this.getDuplex() === Duplex.HALF && this.sendingTransission !== null) {
            this.sendingTransission.getChild()!.abort(this.sendingTransission.getLifeTime() * this.getChild()!.getSpeedBpms());
            this.jam();
        }
        this.getParent()!.receive(transmission);
    }

    negotiate(connection: Connection) {
        const ports = connection.getParents();
        const partner = ports[0] === this ? ports[1] : ports[0];
        if(!partner) return;
        const partnerDuplexCapability = partner.getDuplexCapability();
        switch(this.duplexCapability) {
            case Duplex.HUB:
            case Duplex.HALF:
                this.setDuplex(this.duplexCapability);
                partner.setDuplex(partnerDuplexCapability === Duplex.HUB ? Duplex.HUB : Duplex.HALF);
                break;
            case Duplex.FULL:
                this.setDuplex(partnerDuplexCapability === Duplex.FULL ? Duplex.FULL : Duplex.HALF);
                partner.setDuplex(partnerDuplexCapability === Duplex.FULL ? Duplex.FULL : partnerDuplexCapability);
                break;
        }
    }

    setChild(child: Connection): void {
        super.setChild(child);
        this.negotiate(child);
    }

    addChild(child: Connection): void {
        super.addChild(child);
        this.negotiate(child);
    }

    setDuplex(duplex: Duplex) {
        this.duplex = duplex;
    }

    getDuplex() {
        return this.duplex;
    }

    getDuplexCapability() {
        return this.duplexCapability;
    }

    _hoverState(px: number, py: number, draggingElement: GUIElement | null = null): GUIElement<any, any> | null {
        this.setInteractive(this.getChild() === null);
        return super._hoverState(px, py, draggingElement);
    }


    contains(px: number, py: number, dragging: GUIElement | null = null) {
        if (dragging !== null && !(dragging instanceof Connection) && !(dragging instanceof Port)) return false;
        const rect = this.getParent()!.getParent()!.getParent()!.getRect();
        return (
            px >= rect.x - this.width/2 + this.x &&
            px <= rect.x - this.width/2 + this.x + 10 &&
            py >= rect.y - this.height/2 + this.y &&
            py <= rect.y - this.height/2 + this.y + 10
        );
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        const rect = this.getParent()!.getParent()!.getParent()!.getRect();
        ctx.fillRect(rect.x - this.width/2 + this.x, rect.y - this.height/2 + this.y, 10, 10);
        if (this.isHovered) {
            ctx.strokeRect(rect.x - this.width/2 + this.x, rect.y - this.height/2 + this.y, 10, 10);
        }
    }

}