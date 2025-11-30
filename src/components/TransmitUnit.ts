import { GUITransmitUnit } from "../guiComponents/GUITransmitUnit";

export class TransmitUnit extends GUITransmitUnit {

    private received: boolean = false;
    
    update(deltaT: number) {
        const deltaP = deltaT / this.getParent()!.delay;
        this.progress += deltaP;
        this.lifeTime += deltaT;
        const [from, to] = this.getParent()!.getPorts();
        const receiver = this.forward ? to : from;
        if (!receiver) return; // TODO: This is a quick fix. a proper solution includes corruptinge the TUs and deleting it from the connection.
        if (this.isFirstByteReceived() && !this.received) {
            this.received = true;
            receiver.receive(this);
        }
        if (this.isFullyReceived()) {
            this.getParent()!.removeTransitUnit(this);
        }
    }

}