import { TopoNet } from "../..";

import { icon } from "@fortawesome/fontawesome-svg-core";
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

library.add(faTimes);

enum Direction { None, N, E, S, W, NE, SE, SW, NW };
export class UIWindowElement extends HTMLElement {
    
    private readonly RESIZE_MARGIN = 5;
    private readonly MIN_HEIGHT = 100;
    private readonly MIN_WIDTH = 200;

    private shadow: ShadowRoot;

    private offsetX = 0;
    private offsetY = 0;
    private dragging = false;

    private resizing = false;
    private resizeDirection: Direction = Direction.None;
    private startWidth = 0;
    private startHeight = 0;
    private startLeft = 0;
    private startTop = 0;
    private startX = 0;
    private startY = 0;
    

    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);
    }

    connectedCallback() {
        const container = document.createElement("div");
        container.id = "container";

        const topBar = document.createElement("div");
        topBar.id = "topbar";

        const title = document.createElement("span");
        title.textContent = this.getAttribute("title") || "Unnamed Window";

        const svgIcon = icon(faTimes).node[0] as SVGElement;
        const closeButton = document.createElement("button");
        closeButton.appendChild(svgIcon);
        closeButton.id = "closeButton";
        closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.close();
        });

        topBar.append(title, closeButton);
        
        const content = document.createElement("div");
        content.innerHTML = `<slot></slot>`;
        content.id = "content";

        const width = parseInt(this.getAttribute("width") || "200");
        const height = parseInt(this.getAttribute("height") || "200");

        const left = window.innerWidth/2 - width/2;
        const top = window.innerHeight/2 - height/2;

        const style = document.createElement("style");
        style.textContent = `
            :host {
                position: absolute;
                top: ${top}px;
                left: ${left}px;
                width: ${width}px;
                height: ${height}px;
                background: rgba(255, 255, 255, 1);
                border-radius: 5px 5px 0 0;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
                background: #333;
                border: 1px solid #000;
                user-select: none;
                font-family: arial;
                box-sizing: border-box;
            }
            #container {
                display: flex;
                flex-direction: column;
                height: 100%;
                border-radius: 5px 5px 0 0;
                box-sizing: border-box;
                overflow: hidden;
                border-top: 1px solid #888;
            }
            #topbar {
                background: #333;
                border-radius: 5px 5px 0 0;
                color: #eee;
                padding: 6px 10px 3px 10px;
                cursor: move;
                flex: 0 0 auto;
                display: flex;
                justify-content: space-between;
            }
            #closeButton {
                background: #3377ff;
                color: white;
                border: 0 none;
                border-radius: 100%;
                height: 20px;
                width: 20px;
                padding: 6px 5px 5px 6px;
                box-shadow: 0 0 2px rgba(255,255,255,0.4);
                display: flex;
                justify-content: center;
                align-items: center;

            }
            #closeButton:hover {
                background: #4499ff;
            }
            #content {
                flex: 1;
                overflow: auto;
                background: white;
                margin: 3px;
            }
        `;

        container.append(topBar, content);
        this.shadow.append(style, container);

        topBar.addEventListener("mousedown", this.onTopBarMouseDown.bind(this));
        this.addEventListener("mousedown", this.onMouseDown.bind(this));
        window.addEventListener("mouseup", this.boundMouseUp);
        window.addEventListener("mousemove", this.boundMouseMove);
    }

    disconnectedCallback() {
        window.removeEventListener("mouseup", this.boundMouseUp);
        window.removeEventListener("mousemove", this.boundMouseMove);
    }

    close() {
        this.dispatchEvent(new CustomEvent("close", {
            bubbles: true,
            composed: true,
        }));
    }

    private onMouseDown(e: MouseEvent) {
        const rect = this.getBoundingClientRect();
        
        if (this.resizeDirection) {
            this.resizing = true;
            this.startWidth = rect.width;
            this.startHeight = rect.height;
            this.startLeft = rect.left;
            this.startTop = rect.top;
            this.startX = e.clientX;
            this.startY = e.clientY;
            return;
        }
        
    }

    private onTopBarMouseDown(e: MouseEvent) {
        
        const rect = this.getBoundingClientRect();
        
        this.dragging = true;
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
    }

    private onMouseUp(e: MouseEvent) {
        this.dragging = false;
        this.resizing = false;
    }

    private detectResizeZone(e: MouseEvent) {
        const rect = this.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const margin = this.RESIZE_MARGIN;

        const onLeft = x < margin;
        const onRight = x > rect.width - margin;
        const onTop = y < margin;
        const onBottom = y > rect.height - margin;

        if (onTop && onLeft) return Direction.NW;
        if (onTop && onRight) return Direction.NE;
        if (onBottom && onLeft) return Direction.SW;
        if (onBottom && onRight) return Direction.SE;
        if (onTop) return Direction.N;
        if (onRight) return Direction.E;
        if (onBottom) return Direction.S;
        if (onLeft) return Direction.W;

        return Direction.None;
    };

    private onMouseMove(e: MouseEvent) {
        
        const margin = 8;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (this.dragging) {    
            let left = e.clientX - this.offsetX;
            let top = e.clientY - this.offsetY;
            
            left = Math.max(margin, Math.min(left, viewportWidth - this.offsetWidth - margin));
            top = Math.max(margin, Math.min(top, viewportHeight - this.offsetHeight - margin));
            
            this.style.left = left + "px";
            this.style.top = top + "px";

            return;
        }

        if (this.resizing) {
            console.log(this.resizeDirection);
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;

            if ([Direction.E, Direction.NE, Direction.SE].includes(this.resizeDirection)) {
                let width = this.startWidth + dx;
                width = Math.max(Math.min(viewportWidth-this.startLeft-margin, width), this.MIN_WIDTH);
                this.style.width = width + "px";
            }
            if ([Direction.S, Direction.SE, Direction.SW].includes(this.resizeDirection)) {
                let height = this.startHeight + dy;
                height = Math.max(Math.min(viewportHeight-this.startTop-margin, height), this.MIN_HEIGHT);
                this.style.height = height + "px";
            }

            if ([Direction.W, Direction.NW, Direction.SW].includes(this.resizeDirection)) {
                let width = this.startWidth - dx;
                let left = this.startLeft + dx;
                
                if (left < margin) {
                    const dx = margin - left;
                    left = margin;
                    width -= dx;
                }

                if (width < this.MIN_WIDTH) {
                    const dx = this.MIN_WIDTH - width;
                    left -= dx;
                    width = this.MIN_WIDTH;
                }

                this.style.width = width + "px";
                this.style.left = left + "px";
            }
            if ([Direction.N, Direction.NE, Direction.NW].includes(this.resizeDirection)) {
                let height = this.startHeight - dy;
                let top = this.startTop + dy;

                if (top < margin) {
                    const dy = margin - top;
                    top = margin;
                    height -= dy;
                }

                if (height < this.MIN_HEIGHT) {
                    const dy = this.MIN_HEIGHT - height;
                    top -= dy;
                    height = this.MIN_HEIGHT;
                }

                this.style.height = height + "px";
                this.style.top = top + "px";
            }



            return;
        }
        
        this.resizeDirection = this.detectResizeZone(e);

        switch(this.resizeDirection) {
            case Direction.N:
            case Direction.S: {
                this.style.cursor = "ns-resize";
                break;
            }
            case Direction.W:
            case Direction.E: {
                this.style.cursor = "ew-resize";
                break;
            }
            case Direction.NE:
            case Direction.SW: {
                this.style.cursor = "nesw-resize";
                break;
            }
            case Direction.NW:
            case Direction.SE: {
                this.style.cursor = "nwse-resize";
                break;
            }
            default: {
                if (this.style.cursor !== "move") this.style.cursor = "default";
            }
        }

    }

}


export class UIWindow {

    private window: HTMLElement;
    private display: TopoNet;

    constructor(display: TopoNet, title: string = "Window", widht: number = 600, height: number = 400) {
        if(!customElements.get("ui-window")) customElements.define('ui-window', UIWindowElement);

        this.display = display;

        this.window = document.createElement("ui-window");
        this.window.setAttribute("title", title);
        this.window.setAttribute("height", `${height}`);
        this.window.setAttribute("width", `${widht}`);

        this.window.addEventListener("close", () => {
            this.display.removeElement(this.window);
        });
        
        this.display.append(this.window);
    }

    setContent(content: string) {
        this.window.innerHTML = content;
    }
    
}