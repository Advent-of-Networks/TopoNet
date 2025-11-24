import { PacketMode } from "../engine/Emulation";
import { pointOnBezier, subdivideBezier } from "../lib/bezier";
import { Connection } from "./Connection";
import { EthernetFrame } from "./EthernetFrame";
import { Direction } from "./types";

export class TransitUnit {
    
    private static nextId: number = 0;
    id: number;
    
    progress: number = 0;
    lifeTime: number = 0;
    corruptAt: number | null = null;

    private received: boolean = false;
    
    constructor(
        public payload: EthernetFrame,
        public connection: Connection,
        public forward: boolean = true
    ) {
        this.id = TransitUnit.nextId++;
    }

    /**
     * Returns length (in bits) of TransUnit
     */
    length(): number {
        // TODO: easy access to emulation needed
        if (this.connection.from.nic.node.emulation.packetMode === PacketMode.LOGICAL) return 0;
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
        const d_trans = this.length()/this.connection.speed;
        return this.lifeTime >= d_trans;
    }

    /**
     * All bits of packet have been received
     */
    isFullyReceived(): boolean {
        const d_trans = this.length()/this.connection.speed;
        return this.lifeTime >= d_trans + this.connection.delay;
    }

    /**
     * First bit of packet has been received
     */
    isFirstByteReceived(): boolean {
        return this.lifeTime >= this.connection.delay;
    }
    
    update(deltaT: number) {
        const deltaP = deltaT / this.connection.delay;
        this.progress += deltaP;
        this.lifeTime += deltaT;
        const receiver = this.forward ? this.connection.to : this.connection.from;
        if (this.isFirstByteReceived() && !this.received) {
            this.received = true;
            receiver.receive(this);
        }
        if (this.isFullyReceived()) {
            this.connection.removeTransitUnit(this);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const start = this.forward ? this.connection.from : this.connection.to;
        const end   = this.forward ? this.connection.to : this.connection.from;

        const x1 = start.nic.node.x + start.offsetX;
        const y1 = start.nic.node.y + start.offsetY;
        const x4 = end.nic.node.x   + end.offsetX;
        const y4 = end.nic.node.y   + end.offsetY;

        let cp1X = x1, cp1Y = y1;
        let cp2X = x4, cp2Y = y4;

        const offset = 50;

        switch(start.side) {
            case Direction.NORTH: cp1Y -= offset; break;
            case Direction.SOUTH: cp1Y += offset; break;
            case Direction.WEST:  cp1X -= offset; break;
            case Direction.EAST:  cp1X += offset; break;
        }

        switch(end.side) {
            case Direction.NORTH: cp2Y -= offset; break;
            case Direction.SOUTH: cp2Y += offset; break;
            case Direction.WEST:  cp2X -= offset; break;
            case Direction.EAST:  cp2X += offset; break;
        }

        if (this.connection.from.nic.node.emulation.packetMode === PacketMode.LOGICAL) {
            // TODO: for higher layers, this view makes sense, but disable transmission delay!
            const p = this.progress;

            const px = pointOnBezier(p, x1, cp1X, cp2X, x4);
            const py = pointOnBezier(p, y1, cp1Y, cp2Y, y4);

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const t = this.lifeTime;
            const d_trans = this.length()/this.connection.speed;
            
            let t1 = Math.min(t/this.connection.delay);
            let t2 = Math.min(1, Math.max((t-d_trans)/this.connection.delay, 0));
            
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