import { Connection } from "../components/Connection";
import { NIC } from "../components/NIC";
import { Port } from "../components/Ports";
import { Direction } from "../components/types";
import { Emulation } from "../engine/Emulation";
import { GUIElement } from "./GUIElement";

export class GUIPort extends GUIElement<NIC, Connection> {


    side: Direction;

    constructor(emulation: Emulation, nic: NIC, side: Direction) {
        super(nic, emulation, 0, 0, 10, 10);
        this.side = side;
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