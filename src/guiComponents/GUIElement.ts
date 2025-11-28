import { Rect } from "../components/types";
import { Emulation } from "../engine/Emulation";

enum State {
    Update,
    Render,
}

export class GUIElement<
    TParent extends GUIElement<any, any> = GUIElement<any, any>,
    TChild extends GUIElement<any, any> = GUIElement<any, any>
> {

    private static nextId: number = 0;
    private id: number;
    private emulation: Emulation;
    private children: TChild[] = [];
    private parents: TParent[] = [];
    private state: State = State.Update;
    private interactive: boolean;
    private processing: boolean = false;

    protected x: number;
    protected y: number;
    protected width: number;
    protected height: number;

    protected isHovered: boolean = false;

    constructor(parent: TParent | null, emulation: Emulation, x: number = 0, y: number = 0, width: number = 50, height: number = 50, interactive: boolean = false) {
        this.id = GUIElement.nextId++;
        this.emulation = emulation;
        if (parent !== null) {
            this.setParent(parent);
        }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.interactive = interactive;
    }

    setHover(state: boolean) {
        this.isHovered = state;
    }

    setInteractive(value: boolean) {
        this.interactive = value;
    }

    setParent(parent: TParent) {
        this.parents[0] = parent;
        parent.addChild(this);
    }

    addParent(parent: TParent) {
        this.parents.push(parent);
        parent.addChild(this);
    }

    getParent() {
        return this.parents.length > 0 ? this.parents[0] : null;
    }

    getParents() {
        return this.parents;
    }

    addChild(child: TChild) {
        this.children.push(child);
    }

    getChild() {
        return this.children.length > 0 ? this.children[0] : null;
    }

    removeChild(child: TChild) {
        this.children = this.children.filter(c => c !== child);
    }

    getChildren() {
        return this.children;
    }

    contains(px: number, py: number) {
        return (
            px >= this.x - this.width/2 &&
            px <= this.x + this.width/2 &&
            py >= this.y - this.height/2 &&
            py <= this.y + this.height/2
        );
    }

    hovering(px: number, py: number): GUIElement<any, any> | null {
        // TODO: for performance reasons, check if the element is inside the display first

        // abort if element already processing to prevent loops
        if(this.processing) return null;

        let el: GUIElement | null = null;

        for (const child of this.children) {
            el = child.hovering(px, py);
            if (el === child) break; // abort for performance reasons
        }
        if (!el) el = this.interactive && this.contains(px, py) ? this : null;
        return el;
    }

    getID() {
        return this.id;
    }

    setX(x: number) { this.x = x; }
    setY(y: number) { this.y = y; }

    getRect(): Rect {
        return {
            x: this.x,
            y: this.y,
            witdh: this.width,
            height: this.height,
        };
    }

    update(deltaT: number) {}

    render(ctx: CanvasRenderingContext2D) {}

    getEmulation(): Emulation {
        return this.emulation;
    }

    _getState(): State {
        return this.state;
    }

    _update(deltaT: number) {
        if (this.state !== State.Update) {
            console.warn(`Element got updated twice [${this.constructor.name} #${this.id}]`);
            return;
        } 
        // only update if all parents were already updated
        //   > this hinders update of looped dependencies.
        for(const parent of this.parents) {
            if (parent._getState() === State.Update) return;
        }
        this.update(deltaT);
        this.state = State.Render;
        for (const child of this.children) {
            child._update(deltaT);
        }
    }

    _render(ctx: CanvasRenderingContext2D) {
        // do not rerender if it was already rendered
        if (this.state !== State.Render) {
            console.warn(`Element got rendered twice [${this.constructor.name} #${this.id}]`);
            return;
        }
        // only render if all parents were already rendered
        //   > this hinders rendering of looped dependencies.
        for(const parent of this.parents) {
            if (parent?._getState() === State.Render) return;
        }
        this.render(ctx);
        this.state = State.Update;
        for (const child of this.children) {
            child._render(ctx);
        }
    }
}