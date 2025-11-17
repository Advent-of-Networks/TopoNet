
export class UIWindow extends HTMLElement {
    
    private shadow: ShadowRoot;

    private offsetX = 0;
    private offsetY = 0;
    private dragging = false;

    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;
    private boundMouseDown: (e: MouseEvent) => void;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);
        this.boundMouseDown = this.onMouseDown.bind(this);
    }

    connectedCallback() {
        const container = document.createElement("div");
        const topBar = document.createElement("div");
        topBar.textContent = this.getAttribute("title") || "Unnamed Window";
        topBar.id = "topbar";

        const style = document.createElement("style");
        style.textContent = `
            :host {
                position: absolute;
                top: 20px;
                left: 20px;
                width: 200px;
                height: 120px;
                background: rgba(255, 255, 255, 1);
                border: 1px solid #gray;
                border-radius: 3px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                overflow: auto;
                user-select: none;
            }
            #topbar {
                background: gray;
                padding: 3px 5px;
                cursor: move;
            }
        `;

        container.append(topBar);
        this.shadow.append(style, container);

        topBar.addEventListener("mousedown", this.boundMouseDown);
        window.addEventListener("mouseup", this.boundMouseUp);
        window.addEventListener("mousemove", this.boundMouseMove);
    }

    disconnectedCallback() {
        window.removeEventListener("mouseup", this.boundMouseUp);
        window.removeEventListener("mousemove", this.boundMouseMove);
    }

    private onMouseDown(e: MouseEvent) {
        this.dragging = true;
        const rect = this.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
    }

    private onMouseUp(e: MouseEvent) {
        this.dragging = false;
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.dragging) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = e.clientX - this.offsetX;
        let top = e.clientY - this.offsetY;

        const margin = 8;

        left = Math.max(margin, Math.min(left, viewportWidth - this.offsetWidth - margin));
        top = Math.max(margin, Math.min(top, viewportHeight - this.offsetHeight - margin));

        this.style.left = left + "px";
        this.style.top = top + "px";
    }

}