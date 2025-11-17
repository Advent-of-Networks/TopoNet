import { Connection } from "../components/Connection";
import { NetworkNode } from "../components/NetworkNode";
import { Port } from "../components/Ports";
import { Camera } from "./Camera";
import { Mouse } from "./Mouse";

export class Emulation {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    ctx = this.canvas.getContext('2d')!;

    hoveringNode: NetworkNode | null = null;
    draggingNode: NetworkNode | null = null;
    offsetX = 0;
    offsetY = 0;
    speedFactor: number = 0.1;

    startTime = performance.now();
    lastFrameTime = this.startTime;
    fps = 0;

    mouse = new Mouse();
    camera = new Camera();

    nodes: NetworkNode[] = [];
    ports: Port[] = [];
    connections: Connection[] = [];

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
        const chance = 500;
        for (const port of this.ports) {
            const rand = Math.floor(Math.random()*chance);
            if (rand ===0) {
                port.send();
            }
        }

        this.connections.forEach(connection => connection.update(deltaT));
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(this.camera.x, this.camera.y);
        this.nodes.forEach(node => node.render(this.ctx));
        this.connections.forEach(connection => connection.render(this.ctx));
        this.ctx.restore();
    }

    debug(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.resetTransform();
        ctx.fillStyle = 'black';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

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
            ctx.fillText(line, 10, 10 + i * 18);
        });

        ctx.restore();
    }

    loop() {
        const deltaT = this.updateFPS();
        this.update(deltaT * this.speedFactor);
        this.render();
        this.debug(this.ctx);
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
}