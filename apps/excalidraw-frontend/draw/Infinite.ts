export class Infinite{
    public scale : number = 1 ; 

    // offsetX/Y -> How far the Virtual viewport origin has panned/far away from the Real virtual origin (0,0)
    public offsetX : number = 0 ; 
    public offsetY : number = 0 ; 

    private canvas  : HTMLCanvasElement ;
    private context :  CanvasRenderingContext2D ; 

    public draw = () => { }

    ToXVirtual = (xReal : number) : number => (xReal / this.scale) + this.offsetX ; 
    ToYVirtual = (yReal : number) : number => (yReal / this.scale) + this.offsetY ; 
    
    ToXReal = (xVirtual : number) : number => (xVirtual - this.offsetX) * this.scale ; 
    ToYReal = (yVirtual : number) : number => (yVirtual - this.offsetY) * this.scale ; 

    virtualHeight = (realHeight? : number) : number => (realHeight ?? this.canvas.height) / this.scale ;
    virtualWidth  = (realWidth?  : number) : number  => (realWidth ?? this.canvas.width) / this.scale ;

    constructor(canvas : HTMLCanvasElement, context :  CanvasRenderingContext2D, draw? : () => void){
        this.canvas   = canvas ; 
        this.context  = context ; 
        canvas.height = document.body.clientHeight ;
        canvas.width  = document.body.clientWidth ;
        this.initWheelEvents() ; 
        if(draw) this.draw = draw ;
        this.draw() ;
    }

 // so basically in case of : 
 // Panning -> i want new virtual coordinate 
 // Zooming -> i want the virtual coordinate to remain same

    initWheelEvents = () => {
        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();            
            if (event.ctrlKey) { // Zooming
                const zoomFactor = 1 - event.deltaY * 0.01;
                const newScale = Math.max(0.1, Math.min(20, this.scale * zoomFactor)); 
                
                console.log(event.deltaY)

                const mouseXVirtual = this.ToXVirtual(event.offsetX);
                const mouseYVirtual = this.ToYVirtual(event.offsetY);
                
                this.scale = newScale;
                
                this.offsetX = mouseXVirtual - (event.offsetX / this.scale);
                this.offsetY = mouseYVirtual - (event.offsetY / this.scale);
            }   
            else { // Panning 
                this.offsetX += event.deltaX / this.scale;
                this.offsetY += event.deltaY / this.scale;
            }
            this.draw();
        }, { passive : false });
    };
}