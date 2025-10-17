export class Infinite{
    public scale : number= 1 ; 
    public offsetX : number = 0 ; 
    public offsetY : number = 0 ; 
    public zoomAmount : number = 0 ;

    private currTouch0 = {x : 0, y: 0} ;
    private currTouch1 = {x : 0, y: 0} ;
    private prevTouch0 = {x : 0, y: 0} ;
    private prevTouch1 = {x : 0, y: 0} ;

    private touchMode : "single" | "double" = "single" ; 
    private prevTouch : any = [] 
    private cellSize  : number = 100 ;

    private canvas  : HTMLCanvasElement ;
    private context :  CanvasRenderingContext2D 

    ToXVirtual = (xReal : number) : number => (xReal + this.offsetX) * this.scale ; 
    ToYVirtual = (yReal : number) : number => (yReal + this.offsetY) * this.scale ; 
    
    ToXReal = (xVirtual : number) : number => (xVirtual/ this.scale) - this.offsetX ; 
    ToYReal = (yVirtual : number) : number => (yVirtual/ this.scale) - this.offsetY ; 

    virtualHeight = () : number => (document.body.clientHeight/this.scale) ;
    virtualWidth  = () : number =>  (document.body.clientWidth/this.scale) ;

    constructor(canvas : HTMLCanvasElement,context :  CanvasRenderingContext2D,draw? : () => void){
        this.canvas   = canvas ; 
        this.context  = context ; 
        canvas.height = document.body.clientHeight ;
        canvas.width  = document.body.clientWidth ;
        // this.initTouchEvents() ;  //  touchscreen
        this.initWheelEvents() ; 
        // this.initPointerEvents() ; 
        if(draw) this.draw = draw ;
        this.draw() ;
    }

    initWheelEvents = () => {
        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();

            if (event.ctrlKey) {
                const zoomAmount = 1 - event.deltaY * 0.001; // smooth zoom
                const mouseX = event.offsetX;
                const mouseY = event.offsetY;

                // Zoom around cursor position
                this.offsetX -= (mouseX / this.scale - mouseX / (this.scale * zoomAmount));
                this.offsetY -= (mouseY / this.scale - mouseY / (this.scale * zoomAmount));
                this.scale *= zoomAmount;
            } 
            // Pan when two-finger scroll (no ctrl)
            else {
                this.offsetX += event.deltaX / this.scale;
                this.offsetY += event.deltaY / this.scale;
            }

            this.draw();
        }, { passive : false }
        );
    };

    initPointerEvents = () => {
        let isDragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener("pointerdown", (event) => {
            isDragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
        });

        window.addEventListener("pointermove", (event) => {
            if (!isDragging) return;
            const dx = (event.clientX - lastX) / this.scale;
            const dy = (event.clientY - lastY) / this.scale;

            this.offsetX += dx;
            this.offsetY += dy;

            lastX = event.clientX;
            lastY = event.clientY;

            this.draw();
        });

        window.addEventListener("pointerup", () => isDragging = false);
    };

    initTouchEvents = () =>{
        const onTouchStart = (touches : TouchList) =>{
            if(touches.length == 1) this.touchMode = "single" ;
            else if(touches.length == 2)  this.touchMode = "double" ;

            this.prevTouch[0] = touches[0] ; 
            this.prevTouch[1] = touches[1] ;
            onTouchMove(touches) ;
        }

        const onTouchMove = (touches : TouchList) =>{
            this.currTouch0.x = touches[0].pageX ;
            this.currTouch0.y = touches[0].pageY ;
            this.prevTouch0.x = this.prevTouch[0].pageX ;
            this.prevTouch0.y = this.prevTouch[0].pageY ;

            if(this.touchMode == "single") this.Panning()
            else if(this.touchMode == "double" && touches.length == 2){
                this.currTouch1.x = touches[1].pageX ;
                this.currTouch1.y = touches[1].pageY ;
                this.prevTouch1.x = this.prevTouch[1].pageX ;
                this.prevTouch1.y = this.prevTouch[1].pageY ;
                this.Zooming() ;
                this.Panning() ; 
            }

            this.prevTouch[0] = touches[0] ;
            this.prevTouch[1] = touches[1] ;

            this.draw() ;
        }

        this.canvas.addEventListener("touchstart",(event)=>{
            onTouchStart(event.touches) ;
        }) ; 

        this.canvas.addEventListener("touchmove",(event)=>{
            onTouchMove(event.touches) ;
        }) ; 
    }

    Zooming = () =>{
        const distancePreviousTouches = Math.sqrt(
        Math.pow(this.prevTouch0.x - this.prevTouch1.x,2) + Math.pow(this.prevTouch0.y - this.prevTouch1.y,2) 
        ) ; 
    
        const distanceCurrentTouches = Math.sqrt(
        Math.pow(this.currTouch0.x - this.currTouch1.x,2) + Math.pow(this.currTouch0.y - this.currTouch1.y,2) 
        ) ; 

        this.zoomAmount = distanceCurrentTouches/distancePreviousTouches ;
        this.scale = this.scale * this.zoomAmount ;     
    }

    Panning = () =>{
        const prevMidX = (this.prevTouch0.x + this.prevTouch1.x)/2 ;
        const prevMidY = (this.prevTouch0.y + this.prevTouch1.y)/2 ;

        const currMidX = (this.currTouch0.x + this.currTouch1.x)/2 ;
        const currMidY = (this.currTouch0.y + this.currTouch1.y)/2 ;

        const panX = currMidX - prevMidX ; 
        const panY = currMidY - prevMidY ; 

        this.offsetX += panX / this.scale ; 
        this.offsetY += panY / this.scale ; 

        const scaleAmount = 1 - this.zoomAmount ; 
        const zoomRatioX = currMidX/this.canvas.clientWidth ; 
        const zoomRatioY = currMidY/this.canvas.clientHeight  ;

        const unitsZoomedX = this.virtualWidth()  * scaleAmount ; 
        const unitsZoomedY = this.virtualHeight() * scaleAmount ; 

        const unitAddLeft = unitsZoomedX * zoomRatioX ; 
        const unitAddTop  = unitsZoomedY * zoomRatioY ; 

        this.offsetX += unitAddLeft ; 
        this.offsetY += unitAddTop ;
    }

    drawGrid = () =>{
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.context.strokeStyle = "rgb(229,231,235)";
        this.context.lineWidth = 1;
        
        this.context.beginPath();

        for (let x = (this.offsetX % this.cellSize) * this.scale; x <= width; x += this.cellSize * this.scale) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, height);
        }

        for( let y = (this.offsetY % this.cellSize) * this.scale; y <= height; y += this.cellSize * this.scale) {
        this.context.moveTo(0, y);
        this.context.lineTo(width, y);
        }
        this.context.stroke();
    }

    draw = () =>{
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
    }
}