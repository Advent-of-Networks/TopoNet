import { Connection } from "../components/Connection";
import { NetworkNode } from "../components/NetworkNode";
import { Camera } from "./Camera";
import { Mouse } from "./Mouse";
interface PauseEventDetails {
    paused: boolean;
}

export type PauseEvent = CustomEvent<PauseEventDetails>;

export class Emulation extends EventTarget {
    canvas : HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    gridSize = 100;

    hoveringNode: NetworkNode | null = null;
    draggingNode: NetworkNode | null = null;
    offsetX = 0;
    offsetY = 0;
    speedFactor: number = 0.1;

    startTime = performance.now();
    lastFrameTime = this.startTime;
    fps = 0;

    paused: boolean = false;
    steps: number = 0;
    stepScale: number = 1000;

    debugMode: boolean = false;

    mouse = new Mouse();
    camera = new Camera();

    nodes: NetworkNode[] = [];
    connections: Connection[] = [];

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
    }

    updateFPS() {
        const now = performance.now();
        const deltaT = now - this.lastFrameTime;
        this.fps = 1000 / (now - this.lastFrameTime);
        this.lastFrameTime = now;
        return deltaT;
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    eventToCoords(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const mouseX = (screenX - this.canvas.width/2) / this.camera.zoom - this.camera.x;
        const mouseY = (screenY - this.canvas.height/2) / this.camera.zoom - this.camera.y;
        return [mouseX, mouseY, screenX, screenY];
    }

    mousemove(e: MouseEvent) {
        let screenX, screenY;
        [this.mouse.x, this.mouse.y, screenX, screenY] = this.eventToCoords(e);

        if (this.draggingNode) {
            this.draggingNode.x = this.mouse.x - this.offsetX;
            this.draggingNode.y = this.mouse.y - this.offsetY;
            return;
        }

        if (this.camera.isPanning) {
            const dx = (screenX - this.camera.panStartX) / this.camera.zoom;
            const dy = (screenY - this.camera.panStartY) / this.camera.zoom;
            this.camera.x += dx;
            this.camera.y += dy;
            this.camera.panStartX = screenX;
            this.camera.panStartY = screenY;
            return;
        }

        if (this.hoveringNode) {
            this.hoveringNode.isHovered = false;
            this.hoveringNode = null;
        }

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (this.nodes[i].contains(this.mouse.x, this.mouse.y)) {
                this.hoveringNode = this.nodes[i];
                this.hoveringNode.isHovered = true;
                break;
            }
        }
    }

    mousedown(e: MouseEvent) {
        this.mouse.buttons = e.buttons;

        let screenX, screenY;
        [this.mouse.x, this.mouse.y, screenX, screenY] = this.eventToCoords(e);
        if (this.hoveringNode) {
            this.draggingNode = this.hoveringNode;
            this.offsetX = this.mouse.x - this.draggingNode.x;
            this.offsetY = this.mouse.y - this.draggingNode.y;

            const index = this.nodes.indexOf(this.draggingNode);
            if (index > -1) {
                this.nodes.splice(index, 1);
                this.nodes.push(this.draggingNode);
            }
        } else {
            this.camera.isPanning = true;
            this.camera.panStartX = screenX;
            this.camera.panStartY = screenY;
        }
    }

    mouseup(e: MouseEvent) {
        this.mouse.buttons = e.buttons;
        this.draggingNode = null;
        this.camera.isPanning = false;
    }

    mouseleave(e: MouseEvent) {
        this.mouse.buttons = e.buttons;
        this.draggingNode = null;
        this.camera.isPanning = false;
    }

    wheel(e: WheelEvent) {
        e.preventDefault();

        let screenX, screenY;
        [this.mouse.x, this.mouse.y, screenX, screenY] = this.eventToCoords(e);

        const sx = (screenX - this.canvas.width/2);
        const sy = (screenY - this.canvas.height/2);
        const oldZoom = this.camera.zoom;

        const zoomFactor = 1.001;
        this.camera.zoom *= Math.pow(zoomFactor, -e.deltaY);
        this.camera.zoom = Math.min(5, Math.max(0.1, this.camera.zoom));

        this.camera.x += sx * (1 / this.camera.zoom - 1 / oldZoom);
        this.camera.y += sy * (1 / this.camera.zoom - 1 / oldZoom);
    }

    update(deltaT: number) {
        this.nodes.forEach(node => node.update(deltaT));
        this.connections.forEach(connection => connection.update(deltaT));
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#252D3C";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(this.camera.x, this.camera.y);
        this.background();
        this.nodes.forEach(node => node.render(this.ctx));
        this.connections.forEach(connection => connection.render(this.ctx));
        this.ctx.restore();
    }

    background() {
        this.ctx.save();
        this.ctx.resetTransform();
        
        const scaledGrid = this.gridSize * this.camera.zoom;
        const opacity = Math.min(0.5, Math.max(0.1, scaledGrid/100))*0.3;

        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;

        const mod = (n: number, m: number) => ((n % m) + m) % m;

        const left = mod(this.camera.x * this.camera.zoom  + this.canvas.width/2, scaledGrid);
        const top = mod(this.camera.y * this.camera.zoom  + this.canvas.height/2, scaledGrid);

        for (let x = left; x < this.canvas.width; x+=scaledGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = top; y < this.canvas.height; y+=scaledGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    debug() {
        if(!this.debugMode) return;
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        const lines = [
            `FPS: ${this.fps}`,
            `Mouse`,
            `  Position: ${this.mouse.x} ${this.mouse.y}`,
            `  Buttons: ${this.mouse.buttons}`,
            `Camera`,
            `  Position: ${this.camera.x} ${this.camera.y}`,
            `  isPanning: ${this.camera.isPanning}`,
            `  Panning Start: ${this.camera.panStartX} ${this.camera.panStartY}`,
            `  Zoom: ${this.camera.zoom}`,
            `Time`,
            `  Speed: ${this.speedFactor}`,
            `  Start: ${this.startTime}`,
            `  Last Frame: ${this.lastFrameTime}`,
        ];

        lines.forEach((line, i) => {
            this.ctx.fillText(line, 10, 10 + i * 18);
        });

        this.ctx.restore();
    }

    loop() {
        let deltaT = this.updateFPS();
        if (this.paused) deltaT = this.steps;
        this.steps = 0;
        console.log(deltaT);
        this.update(deltaT * this.speedFactor);
        this.render();
        this.debug();
        requestAnimationFrame(this.loop.bind(this));
    }

    start() {
        window.addEventListener('resize', this.resize.bind(this));
        this.canvas.addEventListener('mousemove', this.mousemove.bind(this));
        this.canvas.addEventListener('mousedown', this.mousedown.bind(this));
        this.canvas.addEventListener('mouseup', this.mouseup.bind(this));
        this.canvas.addEventListener('mouseleave', this.mouseleave.bind(this));
        this.canvas.addEventListener('wheel', this.wheel.bind(this), {passive: false});
        this.resize();
        this.loop();
    }

    step() {
        this.steps += this.stepScale * this.speedFactor;
    }

    togglePause() {
        this.paused = !this.paused;
        this.dispatchEvent(new CustomEvent<PauseEventDetails>("pause", {detail: { paused: this.paused}}));
    }
}