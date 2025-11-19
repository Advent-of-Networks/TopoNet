import { TopoNet } from "../..";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

library.add(faTimes);

export class UIHUD extends HTMLElement {
    
    private shadow: ShadowRoot;
    private container: HTMLElement;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.container = document.createElement("div");
        this.container.id = "container";
    }

    connectedCallback() {
        const buttonSize = 30;
        const padding = 13;

        const height = buttonSize + 2*padding;

        const top = 10;

        const style = document.createElement("style");
        style.textContent = `
            :host {
                position: absolute;
                top: ${top}px;
                height: ${height}px;
                width: 100%;
                display: flex;
                border-radius: 5px 5px;
                user-select: none;
                font-family: arial;
                box-sizing: border-box;
                justify-content: center;
            }
            #container {
                display: flex;
                flex-direction: row;
                height: 100%;
                padding: ${padding}px;
                border-radius: 5px;
                box-sizing: border-box;
                overflow: hidden;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                background: #33333350;
                border-top: 1px solid #888;
                border-bottom: 1px solid #000;
                align-items: center;
                gap: ${padding}px;
            }
            .button {
                border: none;
                background: none;
                margin: 0;
                padding: 0;
                height: ${buttonSize}px;
                width: ${buttonSize}px;
            }
            .button svg {
                width: 100%;
                height: 100%;
                fill: white;
                display: block;
            }
            svg path {
                fill: white;
            }
            
            .button:hover svg path {
                fill: gray;
            }
            .button:disabled svg path {
                fill: gray;
            }
        `;

        this.shadow.append(style, this.container);
    }

    disconnectedCallback() {    }

    addElement(element: HTMLElement) {
        this.container.append(element);
    }
}

export class HUDButton {

    element: HTMLButtonElement;

    constructor(icon: SVGElement, onClick: (event: MouseEvent) => void) {
        this.element = document.createElement("button") as HTMLButtonElement;
        this.element.appendChild(icon);
        this.element.className = "button ";
        this.element.addEventListener("click", onClick);
    }
    
    setIcon(icon: SVGElement) {
        this.element.innerHTML = "";
        this.element.appendChild(icon);
    }
    
    setDisabled(disabled: boolean) {
        this.element.disabled = disabled;
    }
}

export class HUD {

    private hud: UIHUD;
    private display: TopoNet;

    constructor(display: TopoNet) {
        if(!customElements.get("ui-hud")) customElements.define('ui-hud', UIHUD);
        this.display = display;
        this.hud = document.createElement("ui-hud") as UIHUD;
        this.display.append(this.hud);
    }

    appendButton(button: HUDButton) {
        this.hud.addElement(button.element);
    }
    
}