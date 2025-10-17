import { ShapeLabelType } from "@/components/ui/ShapeOptions"
import { EXPRESS_SERVER_URL } from "@/config"
import axios from "axios"
import { Coordinate, Shape } from "@repo/common/GameShapes";
import { Infinite } from "./Infinite";

export class Game{
    private canvas : HTMLCanvasElement ;
    private cxt : CanvasRenderingContext2D  ;
    private ExistingShapes : {shape : Shape}[]= [] ;
    private roomId : string ;
    private socket : WebSocket ;
    private selected : boolean = false ;
    private startX : number = 0 ;
    private startY : number = 0 ;
    private ShapeSelected : ShapeLabelType = "Navigate" ;   
    private Coords  : Coordinate[] = [];
    private infinite : Infinite ;

    constructor(canvas : HTMLCanvasElement,cxt : CanvasRenderingContext2D ,roomId : string,socket : WebSocket){
        this.canvas = canvas ;
        this.cxt = cxt  ;
        this.roomId = roomId ; 
        this.socket = socket 
        this.infinite = new Infinite(canvas,cxt,this.RenderShapes) ;
        this.init() ;     
        this.initSocketHandlers() ;
        this.initMouseHandlers() ;
    }

    private MouseEventHandler = {
        setStartingCoords : (e: globalThis.MouseEvent) =>{ // pointerdown
            this.selected = true ; 
            this.startX = e.clientX ; 
            this.startY = e.clientY ; 
            this.Coords.push({x : this.startX, y : this.startY}) ;
        },

        setEndingCoords : (e: globalThis.MouseEvent) => { // pointerup
            this.selected = false ; 
            if(this.ShapeSelected == "Navigate") return ;

            const rStartX = this.infinite.ToXReal(this.startX) ;
            const rStartY = this.infinite.ToYReal(this.startY) ; 
            const rEndX   = this.infinite.ToXReal(e.clientX) ;
            const rEndY   = this.infinite.ToYReal(e.clientY) ; 
            const rHeight = rEndX - rStartX ;
            const rWidth  = rEndY - rStartY ; 
            console.log(this.Coords) ;
            this.Coords = this.Coords.map((coord : Coordinate) => {
                return {x : this.infinite.ToXReal(coord.x),y : this.infinite.ToYReal(coord.y)}
            }) 

            console.log(this.Coords)
            let shape : Shape | null = null ;
            if(this.ShapeSelected == "Circle")    shape = this.canvasShape.createCircle(rStartX,rStartY,rWidth,rHeight)
            else if(this.ShapeSelected == "Line") shape = this.canvasShape.createLine(rStartX,rStartY,rEndX,rEndY)
            else if(this.ShapeSelected == "Rectangle") shape = this.canvasShape.createRectangle(rStartX,rStartY,rWidth,rHeight)
            else if(this.ShapeSelected == "Pencil") shape = this.canvasShape.createPencil() ;

            if(!shape) return ;

            this.ExistingShapes.push({shape})  ;
            this.Coords = [] ;

            // Create Shape
            this.socket.send(JSON.stringify({
                reqType : "send-shape",
                roomId  :  this.roomId,
                shape   :  shape 
            }))
        },

        getCursorCoords : (e: globalThis.MouseEvent) =>{  // pointermove
            if(!this.selected) return ;

            const height = e.clientY - this.startY ; 
            const width  = e.clientX - this.startX ;  

            if(this.ShapeSelected != "Pencil") this.infinite.draw() ; 

            this.cxt.lineWidth = 2 ; 
            this.cxt.strokeStyle = "rgba(255,255,255)" ;
            this.Coords.push({x : e.clientX, y : e.clientY}) ;

            if(this.ShapeSelected == "Navigate"){
                this.infinite.offsetX += (this.infinite.ToXVirtual(e.clientX) - this.infinite.ToXVirtual(this.startX)) ;
                this.infinite.offsetY += (this.infinite.ToYVirtual(e.clientY) - this.infinite.ToYVirtual(this.startY)) ;
                this.infinite.draw() ;
                this.startX = e.clientX ; 
                this.startY = e.clientY ;
            }
            else if(this.ShapeSelected == "Rectangle") this.canvasShape.renderRectangle(this.startX,this.startY,width,height) ;
            else if(this.ShapeSelected == "Line") this.canvasShape.renderLine(this.startX,this.startY,e.clientX,e.clientY) ;
            else if(this.ShapeSelected == "Pencil") this.canvasShape.renderPencil(this.Coords) ; 
            else if(this.ShapeSelected == "Circle"){    
                const radiusX = (height <= 0) ? 0 : height ; 
                const radiusY = (width <= 0)  ? 0 : width ;

                const centerX = this.startX + width/2 ; 
                const centerY = this.startY + height/2 ; 

                this.canvasShape.renderCircle(centerX,centerY,radiusX,radiusY) ;
            }
        }
    }

    private canvasShape = {
        createRectangle : (startX : number,startY : number,width : number,height : number) : Shape | null => {
            if(height == 0 || width == 0) return null ; 
            const shape : Shape = {
                type : "Rectangle",
                x : startX,
                y : startY,
                height : height,
                width : width,
                coords : this.Coords
            };  
            return shape ;
        },
        renderRectangle :  (startX : number,startY : number,width : number,height : number) => {
            if(height == 0 || width == 0) return null ;
            this.cxt.strokeRect(startX,startY,width,height) ;
        },
        createCircle : (startX : number,startY : number,width : number,height : number) : Shape | null =>{
            if(height <= 0 || width <= 0) return null ;    
            else {
                const radiusX = height ; 
                const radiusY = width ;
                    
                const centerX = startX + width/2 ; 
                const centerY = startY + height/2 ; 

                const shape : Shape ={
                    type : "Circle",
                    centerX : centerX,
                    centerY : centerY,
                    radiusX : radiusX,
                    radiusY : radiusY,
                    coords  : this.Coords
                }; 
                return shape ;
            }
        },
        renderCircle : (centerX : number,centerY : number,radiusX : number,radiusY : number) => {
            this.cxt.beginPath()
            this.cxt.arc(centerX,centerY,Math.max(radiusX,radiusY),0,2*Math.PI,true) ;
            this.cxt.stroke() ;
            this.cxt.closePath()
        },  

        createLine : (startX : number,startY : number,endX : number,endY : number) : Shape | null => {
            if(endX == startX && endY == startY) return null ;
            const shape : Shape = {
                type : "Line",
                startX : startX,
                startY : startY,
                endX   : endX,
                endY   : endY,
                coords : this.Coords
            };          
            return shape ;
        },
        renderLine : (startX : number,startY : number,endX : number,endY : number) =>{
            this.cxt.beginPath()
            this.cxt.moveTo(startX,startY) ; 
            this.cxt.lineTo(endX,endY) ;
            this.cxt.stroke() ;
            this.cxt.closePath()
        },
        
        createPencil : () : Shape => {
            const shape : Shape = {
                type : "Pencil",
                coords : this.Coords 
            }
            return shape ;
        },
        renderPencil : (coords : Coordinate[]) => {
            if(coords.length < 2) return;
            this.cxt.beginPath();
            this.cxt.moveTo(coords[0].x,coords[0].y);
            for (let i = 1; i < coords.length; i++) this.cxt.lineTo(coords[i].x,coords[i].y) ;
            this.cxt.strokeStyle = "rgba(255,255,255)";
            this.cxt.lineWidth = 2 ;
            this.cxt.lineCap = "round";
            this.cxt.lineJoin = "round";
            this.cxt.stroke();
            this.cxt.closePath();        
        },
    }
 
    SelectShape = (shapeName : ShapeLabelType) => this.ShapeSelected = shapeName ;
    
    init = async() => {
       this.ExistingShapes = await getExisitingShapes(this.roomId) ;
       this.infinite.draw() ;
    }

    initSocketHandlers = () => { 
     // Get the Shapes Recieved
        this.socket.onmessage = (e) =>{
            const data = e.data ; 
            const parsedData = JSON.parse(data) ;
            if(parsedData.resType == "delivered-shape"){
                const shape : Shape = parsedData.shape ;
                this.ExistingShapes.push({shape}) ;
                this.infinite.draw() ; 
            }
        } ; 
    }

    initMouseHandlers = () =>{
        this.canvas.addEventListener("pointerdown", this.MouseEventHandler.setStartingCoords) ; 
        this.canvas.addEventListener("pointerup"  , this.MouseEventHandler.setEndingCoords) ; 
        this.canvas.addEventListener("pointermove", this.MouseEventHandler.getCursorCoords) ; 
    }

    cleanup = () =>{
        this.canvas.removeEventListener("pointerdown", this.MouseEventHandler.setStartingCoords);
        this.canvas.removeEventListener("pointerup",   this.MouseEventHandler.setEndingCoords);
        this.canvas.removeEventListener("pointermove", this.MouseEventHandler.getCursorCoords);
    }

    RenderShapes = () =>{
        this.cxt.clearRect(0,0,this.canvas.width,this.canvas.height) ;
        this.cxt.strokeStyle = "rgba(255,255,255)"
        this.cxt.lineWidth = 2 ;
        this.ExistingShapes.map(({shape} : {shape :Shape}) => {
            if(shape == null) return  // skip 
            const l = shape.coords.length ;
            const vStartX = this.infinite.ToXVirtual(shape.coords[0].x) ; 
            const vStartY = this.infinite.ToYVirtual(shape.coords[0].y) ;

            const vEndX = this.infinite.ToXVirtual(shape.coords[l-1].x) ; 
            const vEndY = this.infinite.ToYVirtual(shape.coords[l-1].y) ;

            const vWidth = this.infinite.virtualWidth(shape.coords[l-1].x - shape.coords[0].x) ;
            const vHeight = this.infinite.virtualHeight(shape.coords[l-1].y - shape.coords[0].y) ;

            const vCoords = shape.coords.map((coord : Coordinate) => {
                return {x : this.infinite.ToXVirtual(coord.x),y : this.infinite.ToYVirtual(coord.y)}
            }) 

            if(shape.type == "Rectangle") this.canvasShape.renderRectangle(vStartX,vStartY,vWidth,vHeight)
            else if(shape.type == 'Circle') this.canvasShape.renderCircle(vStartX + vWidth/2,vStartY + vHeight/2,vWidth,vHeight)
            else if(shape.type == 'Line') this.canvasShape.renderLine(vStartX,vStartY,vEndX,vEndY)
            else if(shape.type == "Pencil") this.canvasShape.renderPencil(vCoords) ;         
        })    
    }
}

export async function getExisitingShapes(roomId : string){
    const response = await axios.get(`${EXPRESS_SERVER_URL}/api/v1/room/shapes/${roomId}`,
        {
            headers : {
                token : localStorage.getItem("token") 
            },
            validateStatus : (status) =>  true 
        }
    ) ;
    const shapes = response.data.shapes ;
    return shapes ;     
}