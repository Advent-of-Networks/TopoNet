
import { Connection } from "../components/Connection";
import { Port } from "../components/Ports";
import { TransmitUnit } from "../components/TransmitUnit";
import { Direction, GUIElementDragEvent, GUIElementDropEvent } from "../components/types";
import { Emulation } from "../engine/Emulation";
import { distance, isPointNearBezier } from "../lib/bezier";
import { GUIElement } from "./GUIElement";


export enum DraggingPoint {
    None = -1,
    Start = 0,
    End = 1,
}

export class GUIConnection extends GUIElement<Port | null, TransmitUnit> {

    constructor(emulation: Emulation) {
        super(null, emulation);
        this.setInteractive(true);
        this.addEventListener("onDrag", this.onDrag);
        this.addEventListener("onDrop", this.onDrop);
    }

    protected draggingPoint: DraggingPoint = DraggingPoint.None;
    private offsetX: number = 0;
    private offsetY: number = 0;

    private onDrag(e: Event) {
        if (!(e instanceof GUIElementDragEvent)) return;
        const {offsetX, offsetY} = e.detail;
        const [startX, startY, _cp1X, _cp1Y, _cp2X, _cp2Y, endX, endY] = this.getBezierCurve();
        const mouse = this.getEmulation().mouse;
        if (this.draggingPoint === DraggingPoint.None && distance(mouse, {x: startX, y: startY}) < 6) {
            // TODO: this is hacky. Either there is a generic solution, or we merge GUI and components back together.
            if (this instanceof Connection) {
                this.parents[0]?.removeChild(this);
            }
            this.getChildren().forEach((c) => {c.corrupt(), this.removeChild(c)});
            this.draggingPoint = DraggingPoint.Start;
            this.setInteractive(false);
            this.parents[0] = null;
        }
        if (this.draggingPoint === DraggingPoint.None && distance(mouse, {x: endX, y: endY}) < 6) {
            // TODO: this is hacky. Either there is a generic solution, or we merge GUI and components back together.
            if (this instanceof Connection) {
                this.parents[1]?.removeChild(this);
            }
            this.getChildren().forEach((c) => {c.corrupt(), this.removeChild(c)});
            this.draggingPoint = DraggingPoint.End;
            this.setInteractive(false);
            this.parents[1] = null;
        }
        if (this.draggingPoint) {
            this.offsetX += offsetX;
            this.offsetY += offsetY;
        }
    }


    private onDrop(e: Event) {
        if (!(e instanceof GUIElementDropEvent)) return;
        if (!(this instanceof Connection)) return;
        if (this.draggingPoint === DraggingPoint.None) return;
        const {dropedOn} = e.detail;
        if (dropedOn && dropedOn instanceof Port) {
            this.parents[this.draggingPoint] = dropedOn;
            dropedOn.setChild(this);
            this.setInteractive(true);
        } else {
            // Delete Connection
            for (const parent of this.parents) {
                // TODO: this is hacky. Either there is a generic solution, or we merge GUI and components back together.
                if (parent) parent.removeChild(this);
            }
        }
        this.draggingPoint = DraggingPoint.None;
    }

    getBezierCurve(reverse: boolean = false) {
        const ports = this.getParents();
        let from = ports[0];
        let to = ports[1];

        if (reverse) [from, to] = [to, from];

        
        let startX, startY, endX, endY = 0;

        if (from) {
            const fromRect = from.getRect();
            const fromNodeRect = from.getParent()!.getParent()!.getParent()!.getRect();
            startX = fromNodeRect.x + fromRect.x;
            startY = fromNodeRect.y + fromRect.y;
        } else {
            const mouse = this.getEmulation().mouse;
            startX = mouse.x;
            startY = mouse.y;
        }
        
        if (to) {
            const toNodeRect = to.getParent()!.getParent()!.getParent()!.getRect();
            const toRect = to.getRect();
            endX = toNodeRect.x + toRect.x;
            endY = toNodeRect.y + toRect.y;
        } else {
            const mouse = this.getEmulation().mouse;
            endX = mouse.x;
            endY = mouse.y;
        }

        let cp1X = startX;
        let cp1Y = startY;
        let cp2X = endX;
        let cp2Y = endY;

        const offset = 50;

        // TODO: if from, and/or to are not defined, the offset can dynamically depend on the
        //       direction of the other side.

        if (from) {
            switch(from.side) {
                case Direction.NORTH: cp1Y -= offset; break;
                case Direction.SOUTH: cp1Y += offset; break;
                case Direction.WEST: cp1X -= offset; break;
                case Direction.EAST: cp1X += offset; break;
            }
        }

        if (to) {
            switch(to.side) {
                case Direction.NORTH: cp2Y -= offset; break;
                case Direction.SOUTH: cp2Y += offset; break;
                case Direction.WEST: cp2X -= offset; break;
                case Direction.EAST: cp2X += offset; break;
            }
        }

        return [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY];
    }

    contains(px: number, py: number, dragging: GUIElement | null = null) {
        if (dragging !== null) return false;
        const [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y] = this.getBezierCurve();
        if (distance({x: p0x, y: p0y}, {x: px, y: py}) < 6) return true;
        if (distance({x: p3x, y: p3y}, {x: px, y: py}) < 6) return true;
        return isPointNearBezier(
            {x: px, y: py},
            {
                p0: {x: p0x, y: p0y},
                p1: {x: p1x, y: p1y},
                p2: {x: p2x, y: p2y},
                p3: {x: p3x, y: p3y},
            },
            10/this.getEmulation().camera.zoom
        )
    }

    render(ctx: CanvasRenderingContext2D) {
        const [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY] = this.getBezierCurve();

        ctx.strokeStyle = (this.isHovered || this.draggingPoint !== -1) ? "#5555ee" : "#3333aa";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        ctx.stroke();
    }

    renderPostOrder(ctx: CanvasRenderingContext2D): void {
        const [startX, startY, _cp1X, _cp1Y, _cp2X, _cp2Y, endX, endY] = this.getBezierCurve();
        if (this.isHovered || this.draggingPoint !== -1) {
            const mouse = this.getEmulation().mouse;
            ctx.beginPath();
            ctx.fillStyle = distance(mouse, {x: startX, y: startY}) < 6 ? "#00ee00" : "#33aa33";
            ctx.arc(startX, startY, 5, 0, 2*Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = distance(mouse, {x: endX, y: endY}) < 6 ? "#00ee00" : "#33aa33";
            ctx.arc(endX, endY, 5, 0, 2*Math.PI);
            ctx.fill();
        }
    }
}