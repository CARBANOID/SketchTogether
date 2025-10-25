import { ShapeLabelType } from "@/components/ui/ShapeOptions"
import { EXPRESS_SERVER_URL } from "@/config"
import axios from "axios"
import { Coordinate, Shape } from "@repo/common/GameShapes";
import { Infinite } from "./Infinite";

export class Game{
    private canvas : HTMLCanvasElement ;
    private cxt : CanvasRenderingContext2D  ;
    private ExistingShapes : {shape : Shape, id : number}[]= [] ;
    private roomId : string ;
    private socket : WebSocket ;
    private selected : boolean = false ;
    private startX : number = 0 ;
    private startY : number = 0 ;
    private EndX : number = 0 ;
    private EndY : number = 0 ;
    
    private lastX : number = 0 ;
    private lastY : number = 0 ;
    private ShapeSelected : ShapeLabelType = "Move" ;   
    private Coords  : Coordinate[] = [] ;
    private infinite : Infinite ;
    private text : string = "" ;
    private dpr  : number = window.devicePixelRatio || 1 ;
    private CoordShapeIdMap = new Map<string,number>() ;
    private ShapeSelectedId? : number ;
    private fontSize = 18 ; 

    constructor(canvas : HTMLCanvasElement,cxt : CanvasRenderingContext2D ,roomId : string,socket : WebSocket){
        this.canvas = canvas ;
        this.cxt = cxt  ;
        this.roomId = roomId ; 
        this.socket = socket 
        this.infinite = new Infinite(canvas,cxt,this.RenderShapes) ;
        this.init() ;     
        this.SocketHandlers.initOnMessage() ;
        this.initMouseHandlers() ;
        this.initKeyEvents() ;
    }

    insertIntoCoordShapeIdMap = (shape : Shape,id : number) =>{
        shape.coords.forEach((coord : Coordinate) => this.CoordShapeIdMap.set(JSON.stringify({x : Math.trunc(coord.x) , y : Math.trunc(coord.y)}),id)) ;
    }

    createCoordShapeIdMap = () =>{
        if(this.ExistingShapes.length == 0) return ;
        for(let i = 0 ; i<this.ExistingShapes.length ;i++) this.insertIntoCoordShapeIdMap(this.ExistingShapes[i].shape,i) ;   
    }
    
    private MouseEventHandler = {
        setStartingCoords : (e: globalThis.MouseEvent) =>{ // pointerdown
            this.selected = true ; 
            this.startX = this.lastX = e.clientX ; 
            this.startY = this.lastY = e.clientY ; 

            if(this.ShapeSelected == "Pencil") this.Coords.push({x : this.startX, y : this.startY}) ;

            if(this.ShapeSelected == "Text") this.canvasShape.renderTextBox("|",this.startX,this.startY) ; 
            else if(this.ShapeSelected == "Move"){
                for(let x = this.startX - 5 ; x<= this.startX + 5 ; x++){
                    for(let y = this.startY - 5 ; y<= this.startY + 5 ; y++){
                        const coord : Coordinate = {x : Math.trunc(this.infinite.ToXReal(x)),y : Math.trunc(this.infinite.ToYReal(y))} ;
                        if(this.CoordShapeIdMap.has(JSON.stringify(coord))) {
                            this.ShapeSelectedId = this.CoordShapeIdMap.get(JSON.stringify(coord));
                            console.log(this.ShapeSelectedId)
                            return ;
                        }
                    }
                }  
            }
        },

        setEndingCoords : (e: globalThis.MouseEvent) => { // pointerup
            this.selected = false ; 
            if(['Navigate','Text','Move'].some((shape) => this.ShapeSelected == shape )) return ;

            this.EndX = e.clientX ; 
            this.EndY = e.clientY ; 

            const rStartX = this.infinite.ToXReal(this.startX) ;
            const rStartY = this.infinite.ToYReal(this.startY) ; 
            const rEndX   = this.infinite.ToXReal(this.EndX) ;
            const rEndY   = this.infinite.ToYReal(this.EndY) ; 
            const rHeight = rEndY - rStartY ;
            const rWidth  = rEndX - rStartX ; 


            let shape : Shape | null = null ;
            if(this.ShapeSelected == "Circle")    shape = this.canvasShape.createCircle(rStartX,rStartY,rEndX,rEndY,rWidth,rHeight)
            else if(this.ShapeSelected == "Line") shape = this.canvasShape.createLine(rStartX,rStartY,rEndX,rEndY)
            else if(this.ShapeSelected == "Rectangle") shape = this.canvasShape.createRectangle(rStartX,rStartY,rEndX,rEndY,rWidth,rHeight)
            else if(this.ShapeSelected == "Pencil") shape = this.canvasShape.createPencil() ;

            if(!shape) return ;

            this.ExistingShapes.push({shape : shape , id : -1})  ;
            this.insertIntoCoordShapeIdMap(shape,this.ExistingShapes.length-1) ;
            this.Coords = [] ;

            this.SocketHandlers.createShape(shape) ;
        },

        getCursorCoords : (e: globalThis.MouseEvent) =>{  // pointermove
            if(!this.selected) return ;

            const height = e.clientY - this.startY ; 
            const width  = e.clientX - this.startX ;  

            if(this.ShapeSelected != "Pencil") this.infinite.draw() ; 

            this.cxt.lineWidth = 2 ;    
            this.cxt.strokeStyle = "rgba(255,255,255)" ;

            if( this.ShapeSelected == "Pencil") this.Coords.push({x : e.clientX, y : e.clientY}) ;

            if(this.ShapeSelected == "Navigate"){
                this.infinite.offsetX += ((e.clientX) - (this.lastX))/this.infinite.scale ;
                this.infinite.offsetY += ((e.clientY) - (this.lastY))/this.infinite.scale ;
                this.infinite.draw() ;
                this.lastX = e.clientX ; 
                this.lastY = e.clientY ;
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

    private KeyEventHandler = {
        onkeydown : (e : globalThis.KeyboardEvent) => {
            if(this.ShapeSelected != "Text") return ;

            if(e.key == "Backspace") this.text = this.text.slice(0,-1) ; 
            else if(e.key == "Enter") this.text += "\n" ; 
            else if(e.key == "Escape"){
                if(this.text.length == 0) return ;
                const shape = this.canvasShape.createTextBox(this.text,this.startX,this.startY) ;

                this.ExistingShapes.push({shape : shape , id: -1})  ;
                this.insertIntoCoordShapeIdMap(shape,this.ExistingShapes.length-1) ;
                this.SocketHandlers.createShape(shape) ; 

                this.text = "" ; 
                return ;
            }
            else if(e.key.length == 1) this.text += e.key ;
            this.infinite.draw() ;
            this.canvasShape.renderTextBox(this.text,this.startX,this.startY) ;
        }
    }


    initKeyEvents = () =>{
        this.canvas.addEventListener("keydown",this.KeyEventHandler.onkeydown) ; 
    }

    private canvasShape = {
        createRectangle : (startX : number,startY : number,endX : number,endY : number,width : number,height : number) : Shape | null => {
            if(height == 0 || width == 0) return null ; 

            const coords = this.canvasShape.getRectangleCoords(startX,startY,endX,endY) ; ;             
            const shape : Shape = {
                type : "Rectangle",
                startXY : {x : startX , y : startY},
                endXY   : {x : endX , y : endY},
                height  : height,
                width   : width,
                coords  : coords
            };  
            return shape ;
        },
        renderRectangle :  (startX : number,startY : number,width : number,height : number) => {
            if(height == 0 || width == 0) return null ;
            this.cxt.strokeRect(startX,startY,width,height) ;
        },
        getRectangleCoords : (startX : number,startY : number,endX : number,endY : number) : Coordinate[] =>{
            const coords : Coordinate[] = [] ; 

            let x : number = startX ; 
            while(true){
                coords.push({x : x,y : startY}) ;
                coords.push({x : x,y : endY}) ;                

                if(Math.trunc(x) == Math.trunc(endX)) break ; 
                else if(x < endX) x++ ; 
                else x-- ; 
            }

            let y : number = startY ;
            while(true){
                coords.push({x : startX,y : y}) ;
                coords.push({x : endX,y : y}) ;          

                if(Math.trunc(y) == Math.trunc(endY)) break ; 
                else if(y < endY) y++ ; 
                else y-- ; 
            }

            return coords ; 
        },   


        createCircle : (startX : number,startY : number,endX : number,endY : number,width : number,height : number) : Shape | null =>{
            if(height <= 0 || width <= 0) return null ;    
            else {
                const radiusX = width ; 
                const radiusY = height ;
                    
                const centerX = startX + width/2 ; 
                const centerY = startY + height/2 ; 

                const coords = this.canvasShape.getCircleCoords(centerX,centerY,radiusX,radiusY) ;
                
                const shape : Shape ={
                    type : "Circle",
                    startXY : {x : startX , y : startY},
                    endXY   : {x : endX , y : endY},
                    centerX : centerX,
                    centerY : centerY,
                    radiusX : radiusX,
                    radiusY : radiusY,
                    coords  : coords
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
        getCircleCoords : (centerX : number,centerY : number,radiusX : number,radiusY : number) : Coordinate[] =>{
            const coords : Coordinate[] = [] ; 
            const radius = Math.max(radiusX,radiusY) ;

            for(let angle = 0 ; angle<=360 ; angle++){
                const AngleInRadians = (angle * Math.PI) / 180 ; 
                let x = radius * Math.cos(AngleInRadians) + centerX ;
                let y = radius * Math.sin(AngleInRadians) + centerY ;
                coords.push({x : x , y : y}) ;
            }
            return coords ; 
        },   

        createLine : (startX : number,startY : number,endX : number,endY : number) : Shape | null => {
            if(endX == startX && endY == startY) return null ;
            const coords = this.canvasShape.getLineCoords(startX,startY,endX,endY) ;

            const shape : Shape = {
                type : "Line",
                startXY : {x : startX , y : startY},
                endXY   : {x : endX , y : endY},
                coords  : coords
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
        getLineCoords : (startX : number,startY : number,endX : number,endY : number) : Coordinate[] =>{
            const coords : Coordinate[] = [] ; 

            let dx = endX - startX ;
            let dy = endY - startY ;

            const dist = Math.hypot(dx,dy) ; 
            for(let i = 0 ; i<= dist ; i++){
                const t = i/dist ; 
                const x = startX + t * dx ;
                const y = startY + t * dy ;
                coords.push({ x : x  ,y : y }) ;
            }

            return coords ; 
        },     

        createPencil : () : Shape => {
            this.Coords = this.Coords.map((coord : Coordinate) => {
                return {x : this.infinite.ToXReal(coord.x),y : this.infinite.ToYReal(coord.y)}
            }) 

            const l : number = this.Coords.length ;
            const shape : Shape = {
                type : "Pencil",
                startXY : {x : this.Coords[0].x  , y : this.Coords[l-1].y},
                endXY   : {x : this.Coords[0].x  , y : this.Coords[l-1].y},
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

        createTextBox : (text : string,startX : number,startY : number) : Shape => {
            const coords : Coordinate[] = this.canvasShape.getTextBoxCoords(text,startX,startY) ;
            const l : number = coords.length ;
            
            const shape : Shape = {
                type   : "Text",
                text   : text ,
                startXY : {x : startX , y : startY},
                endXY   : {x : coords[0].x  , y : coords[l-1].y},
                coords : coords
            }
            return shape ;            
        },
        renderTextBox : (text : string ,startX : number,startY : number) => {
            this.cxt.fontStretch = "extra-expanded"
            this.cxt.font = `${this.fontSize/this.infinite.scale}px Arial` ; 
            this.cxt.fillStyle = "rgba(255,255,255)"
            
            const lines = text.split('\n') ; 

            let x = startX , y = startY ; 
            for(let i = 0 ; i<lines.length ; i++){
                this.cxt.fillText(lines[i],x,y) ;
                x = startX ; 
                y += this.infinite.ToYVirtual(this.fontSize + 2) ; 
            }
        },
        getTextBoxCoords : (text : string,startX : number,startY : number) : Coordinate[] =>{
            const coords : Coordinate[] = [] ; 
            const lines  : string[] = text.split('\n') ; 

            let x = startX , y = startY ; 
            for(let i = 0 ; i<lines.length ; i++){
                for(let sx = x ; sx <= (x + lines[i].length * this.fontSize) ; sx++){
                    for(let sy = y - this.fontSize ; sy <= y ; sy++) coords.push({x : sx, y : sy}) ;
                }
                this.cxt.fillText(lines[i],x,y) ;
                y += this.infinite.ToYVirtual(this.fontSize + 2) ; 
            }            

            return coords ; 
        }       
    }
 
    SelectShape = (shapeName : ShapeLabelType) => this.ShapeSelected = shapeName ;
    
    init = async() => {
       this.ExistingShapes = await getExisitingShapes(this.roomId) ;
       this.createCoordShapeIdMap() ;
       this.infinite.draw() ;
    }

    private SocketHandlers = { 
     // Get the Shapes Recieved
        initOnMessage : () => {
            this.socket.onmessage = (e) =>{
            const data = e.data ; 
            const parsedData = JSON.parse(data) ;
            if(parsedData.resType == "delivered-shape"){
                const shape : Shape = parsedData.shape ;
                this.ExistingShapes.push({shape : shape , id : -1}) ;
                this.insertIntoCoordShapeIdMap(shape,this.ExistingShapes.length-1) ;
                this.infinite.draw() ; 
            }} ; 
        },
        createShape : (shape : Shape) =>{
            this.socket.send(JSON.stringify({
                reqType :  "send-shape",
                roomId  :  this.roomId,
                shape   :  shape 
            }))
        },
        deleteShape : (shape : Shape) =>{
            this.socket.send(JSON.stringify({
                reqType :  "delete-shape",
                roomId  :  this.roomId,
                shape   :  shape 
            }))
        },
        updateShape : (shape : Shape) =>{
            this.socket.send(JSON.stringify({
                reqType :  "update-shape",
                roomId  :  this.roomId,
                shape   :  shape 
            }))
        }
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
        this.canvas.removeEventListener("keydown",this.KeyEventHandler.onkeydown) ; 
    }

    RenderShapes = () =>{
        this.cxt.clearRect(0,0,this.canvas.width,this.canvas.height) ;
        this.cxt.strokeStyle = "rgba(255,255,255)"
        this.cxt.lineWidth = 2 ;
        this.ExistingShapes.map(({shape} : {shape : Shape}) => {
            if(shape == null) return  // skip 
            const l = shape.coords.length ;
            const vStartX = this.infinite.ToXVirtual(shape.startXY.x) ; 
            const vStartY = this.infinite.ToYVirtual(shape.startXY.y) ;

            const vEndX = this.infinite.ToXVirtual(shape.endXY.x) ; 
            const vEndY = this.infinite.ToYVirtual(shape.endXY.y) ;

            const vWidth = this.infinite.virtualWidth(shape.endXY.x - shape.startXY.x) ;
            const vHeight = this.infinite.virtualHeight(shape.endXY.y - shape.startXY.y) ;

            const vCoords = shape.coords.map((coord : Coordinate) => {
                return {x : this.infinite.ToXVirtual(coord.x),y : this.infinite.ToYVirtual(coord.y)}
            }) 

            if(shape.type == "Rectangle") this.canvasShape.renderRectangle(vStartX,vStartY,vWidth,vHeight)
            else if(shape.type == 'Circle') this.canvasShape.renderCircle(vStartX + vWidth/2,vStartY + vHeight/2,vWidth,vHeight)
            else if(shape.type == 'Line') this.canvasShape.renderLine(vStartX,vStartY,vEndX,vEndY)
            else if(shape.type == "Pencil") this.canvasShape.renderPencil(vCoords) ;         
            else if(shape.type == "Text") this.canvasShape.renderTextBox(shape.text,vStartX,vStartY) ; 
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