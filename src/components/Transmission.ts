import { Emulation, PacketMode } from "../engine/Emulation";
import { GUIElement } from "../guiComponents/GUIElement";
import { pointOnBezier, subdivideBezier } from "../lib/bezier";
import { Connection } from "./Connection";
import { TransmissionUnit } from "./TransmissionUnit";

export class Transmission extends GUIElement<Connection, TransmissionUnit> {

    public forward: boolean;
    protected corruptAt: number | null = null;

    protected progress: number = 0;
    protected lifeTime: number = 0;
    private received: boolean = false;
    
    constructor(emulation: Emulation, transmissionUnit: TransmissionUnit, connection: Connection, forward: boolean) {
        super(connection, emulation);
        if (transmissionUnit instanceof TransmissionUnit) this.setChild(transmissionUnit);
        this.forward = forward;
    }

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
            this.getParent()!.removeTransmission(this);
        }
    }

    getLifeTime() {
        return this.lifeTime;
    }

    corrupt() {
        this.corruptAt = this.lifeTime;
    }

    /**
     * All bits of packet are on the medium
     */
    isSent(): boolean {
        const d_trans = this.getChild()!.length()/this.getParent()!.getSpeedBpms();
        return this.lifeTime >= d_trans;
    }

    /**
     * All bits of packet have been received
     */
    isFullyReceived(): boolean {
        const d_trans = this.getChild()!.length()/this.getParent()!.getSpeedBpms();
        return this.lifeTime >= d_trans + this.getParent()!.delay;
    }

    /**
     * First bit of packet has been received
     */
    isFirstByteReceived(): boolean {
        return this.lifeTime >= this.getParent()!.delay;
    }

    isCorrupted() {
        return this.corruptAt === null;
    }

    render(ctx: CanvasRenderingContext2D) {

        const [x1, y1, cp1X, cp1Y, cp2X, cp2Y, x4, y4] = this.getParent()!.getBezierCurve(!this.forward);

        if (this.getEmulation().packetMode === PacketMode.LOGICAL) {
            
            const p = this.progress;

            const px = pointOnBezier(p, x1, cp1X, cp2X, x4);
            const py = pointOnBezier(p, y1, cp1Y, cp2Y, y4);

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const t = this.lifeTime;
            const speed = this.getParent()!.getSpeedBpms(); // speed is in bps, but time in ms
            const d_trans = this.getChild()!.length()/speed;
            
            let t1 = Math.min(t/this.getParent()!.delay);
            let t2 = Math.min(1, Math.max((t-d_trans)/this.getParent()!.delay, 0));
            
            const clamp = (v: number) => Math.min(1 - 1e-3, Math.max(1e-3, v));
            t1 = clamp(t1);
            t2 = clamp(t2);
            
            const sub = subdivideBezier({x: x1, y: y1}, {x: cp1X, y: cp1Y}, {x: cp2X, y:cp2Y}, {x: x4, y: y4}, t1, t2);

            ctx.strokeStyle = this.isCorrupted() ? "#6bf16b88" : "#ffaa0088";
            if (this.getChild()!.payload === null) {
                ctx.strokeStyle = "#aa4444";
            }
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sub.p0.x, sub.p0.y);
            ctx.bezierCurveTo(sub.p1.x, sub.p1.y, sub.p2.x, sub.p2.y, sub.p3.x, sub.p3.y);
            ctx.stroke();
        }
    }

}