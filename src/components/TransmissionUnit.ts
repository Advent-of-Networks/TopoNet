import { Emulation, PacketMode } from "../engine/Emulation";
import { GUIElement } from "../guiComponents/GUIElement";
import { EthernetFrame } from "./EthernetFrame";
import { Transmission } from "./Transmission";

export class TransmissionUnit extends GUIElement<Transmission, never> {

    public payload: EthernetFrame | null;
    protected abortedAt: number | null = null;

    constructor(emulation: Emulation, payload: EthernetFrame | null) {
        super(null, emulation);
        this.payload = payload;
    }

     abort(byte: number) {
        this.abortedAt = byte;
    }

    /**
     * Returns length (in bits) of TransUnit
     */
    length(): number {
        if (this.getEmulation().packetMode === PacketMode.LOGICAL) return 0;
        // 55 55 55 55 55 55 55 D5 Payload/EthernetFrame
        // 64bit + payload.length()
        if (!this.payload) {
            // no payload means it is a jam signar (may change later)
            return 32;
        }
        const len = 64 + this.payload.length();
        if (this.abortedAt) return Math.min(len, this.abortedAt);
        return len;
    }

}