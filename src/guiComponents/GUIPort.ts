import { Connection } from "../components/Connection";
import { Port } from "../components/Ports";
import { Direction, GUIElementDropEvent } from "../components/types";
import { Emulation } from "../engine/Emulation";
import { GUIConnection } from "./GUIConnection";
import { GUIElement } from "./GUIElement";
import { GUINIC } from "./GUINIC";

export class GUIPort<TNIC extends GUINIC = GUINIC, TConnection extends GUIConnection = GUIConnection> extends GUIElement<TNIC, TConnection> {


    side: Direction;

    constructor(emulation: Emulation, nic: TNIC, side: Direction) {
        super(nic, emulation, 0, 0, 10, 10);
        this.side = side;
        this.addEventListener("onDrag", this.onDrag);
        this.addEventListener("onDrop", this.onDrop);
    }

    onDrag(e: Event) {
        if (!(this instanceof Port)) return;
        if(!this.getChild()) {
            new Connection(this.getEmulation(), this, null);
        }
    }
    
    onDrop(e: Event) {
        if (!(e instanceof GUIElementDropEvent)) return;
        const newEvent = new GUIElementDropEvent(e.detail);
        this.getChild()?._ondrop(newEvent);
    }

    _hoverState(px: number, py: number): GUIElement<any, any> | null {
        this.setInteractive(this.getChild() === null);
        return super._hoverState(px, py);
    }

    contains(px: number, py: number) {
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