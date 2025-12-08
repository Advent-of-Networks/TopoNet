import { Connection } from "../components/Connection";
import { EthernetFrame } from "../components/EthernetFrame";
import { Emulation, PacketMode } from "../engine/Emulation";
import { pointOnBezier, subdivideBezier } from "../lib/bezier";
import { GUIElement } from "./GUIElement";

export class GUITransmitUnit extends GUIElement<Connection, never> {

    public payload: EthernetFrame;
    public forward: boolean;

    protected progress: number = 0;
    protected lifeTime: number = 0;
    protected corruptAt: number | null = null;

    constructor(emulation: Emulation, payload: EthernetFrame, connection: Connection, forward: boolean) {
        super(connection, emulation);
        this.payload = payload;
        this.forward = forward;
    }

    /**
     * Returns length (in bits) of TransUnit
     */
    length(): number {
        if (this.getEmulation().packetMode === PacketMode.LOGICAL) return 0;
        // if (this.corruptAt !== null) {
        //     return this.corruptAt * this.connection.speed;
        // }
        // 55 55 55 55 55 55 55 D5 Payload/EthernetFrame
        // 64bit + payload.length()
        return 64 + this.payload.length();
    }

    corrupt() {
        this.corruptAt = this.lifeTime;
    }

    /**
     * All bits of packet are on the medium
     */
    isSent(): boolean {
        const d_trans = this.length()/this.getParent()!.speed;
        return this.lifeTime >= d_trans;
    }

    /**
     * All bits of packet have been received
     */
    isFullyReceived(): boolean {
        const d_trans = this.length()/this.getParent()!.speed;
        return this.lifeTime >= d_trans + this.getParent()!.delay;
    }

    /**
     * First bit of packet has been received
     */
    isFirstByteReceived(): boolean {
        return this.lifeTime >= this.getParent()!.delay;
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
            const d_trans = this.length()/this.getParent()!.speed;
            
            let t1 = Math.min(t/this.getParent()!.delay);
            let t2 = Math.min(1, Math.max((t-d_trans)/this.getParent()!.delay, 0));
            
            const clamp = (v: number) => Math.min(1 - 1e-3, Math.max(1e-3, v));
            t1 = clamp(t1);
            t2 = clamp(t2);
            
            const sub = subdivideBezier({x: x1, y: y1}, {x: cp1X, y: cp1Y}, {x: cp2X, y:cp2Y}, {x: x4, y: y4}, t1, t2);
            
            ctx.strokeStyle = this.corruptAt === null ? "#6bf16b88" : "#ffaa0088";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sub.p0.x, sub.p0.y);
            ctx.bezierCurveTo(sub.p1.x, sub.p1.y, sub.p2.x, sub.p2.y, sub.p3.x, sub.p3.y);
            ctx.stroke();
        }
    }
}