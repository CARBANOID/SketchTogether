import { ShapeLabelType } from "@/components/ui/ShapeOptions"
import { EXPRESS_SERVER_URL } from "@/config"
import axios from "axios"
import { Coordinate, Shape } from "@repo/common/GameShapes";
import { Infinite } from "./Infinite";

export class Game{
    private canvas : HTMLCanvasElement ;
    private cxt : CanvasRenderingContext2D  ;
    private ExistingShapes : ({shape : Shape, id : number} | any)[]  = [] ;
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
    private textIndex : number = 0 ;
    private fontSize = 18 ; 
    private clickCount : number = 0 ;
    
    private dpr  : number = window.devicePixelRatio || 1 ;
    private CoordShapeIndexMap = new Map<string,number>() ;
    private ShapeSelectedIndex : number = -1 ;

    private driftX = 0 ;
    private driftY = 0 ;

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
        const StartX = shape.startXY.x ; 
        const StartY = shape.startXY.y ;

        const EndX = shape.endXY.x ; 
        const EndY = shape.endXY.y ;

        const Width = shape.endXY.x - shape.startXY.x ;
        const Height = shape.endXY.y - shape.startXY.y ;

        if(shape.type == "Rectangle") shape.coords = this.canvasShape.getRectangleCoords(StartX,StartY,EndX,EndY)
        else if(shape.type == 'Circle') shape.coords = this.canvasShape.getCircleCoords(StartX + Width/2,StartY + Height/2,Width,Height)
        else if(shape.type == 'Line') shape.coords = this.canvasShape.getLineCoords(StartX,StartY,EndX,EndY)
        else if(shape.type == 'Text') {
            shape.coords = this.canvasShape.getTextBoxCoords(shape.text,StartX,StartY) ;
            shape.endXY.x = shape.coords[shape.coords.length - 1].x ;
            shape.endXY.y = shape.coords[shape.coords.length - 1].y ;
        }   

        shape.coords.forEach((coord : Coordinate) => this.CoordShapeIndexMap.set(JSON.stringify({x : Math.trunc(coord.x) , y : Math.trunc(coord.y)}),id)) ;
    }

    createCoordShapeIdMap = () =>{
        if(this.ExistingShapes.length == 0) return ;
        for(let i = 0 ; i<this.ExistingShapes.length ;i++){ 
            if(this.ExistingShapes[i] != null) this.insertIntoCoordShapeIdMap(this.ExistingShapes[i].shape,i) ;   
        }
    }
    
    getShapeIndex = (startX : number,startY : number) : number =>{
        let shapeIndex : number = -1 ;
        for(let x = startX - 5 ; x <= (startX + 5) ; x++){
            for(let y = startY - 5 ; y <= (startY + 5) ; y++){
                const coord : Coordinate = {x : Math.trunc(this.infinite.ToXReal(x)),y : Math.trunc(this.infinite.ToYReal(y))} ;
                if(this.CoordShapeIndexMap.has(JSON.stringify(coord))) {
                    return shapeIndex = this.CoordShapeIndexMap.get(JSON.stringify(coord)) as number;
                }
            }
        }
        return shapeIndex ;
    }

    private MouseEventHandler = {
        setStartingCoords : (e: globalThis.MouseEvent) =>{ // pointerdown
            this.selected = true ; 
            this.startX = e.clientX ; 
            this.startY = e.clientY ; 

            if(this.ShapeSelected == "Pencil") this.Coords.push({x : this.startX, y : this.startY}) ;
            else if(this.ShapeSelected == "Text") {
                if(this.clickCount == 0){
                    this.canvasShape.renderTextBox("|",this.startX,this.startY) ; 
                    this.clickCount ++ ;
                }else if(this.clickCount == 1){
                    if(this.text.length != 0){
                    const rStartX = this.infinite.ToXReal(this.lastX) ;
                    const rStartY = this.infinite.ToYReal(this.lastY) ; 
                    const shape = this.canvasShape.createTextBox(this.text,rStartX,rStartY) ;

                    let l = this.ExistingShapes.length ; 
                    this.insertIntoCoordShapeIdMap(shape,l-1) ;
                    this.SocketHandlers.createShape(shape)  ; 

                    this.text = "" ; 
                    this.textIndex = 0 ;
                    }
                    this.clickCount = 0 ;
                    this.infinite.draw() ;
                }
            }
            else if(["Move","Delete","Update"].some((s) => s == this.ShapeSelected)){
                const shapeIndex : number = this.ShapeSelectedIndex = this.getShapeIndex(this.startX,this.startY) 
                console.log(shapeIndex);
                if(this.ShapeSelected == "Delete" && shapeIndex >= 0){ 
                    this.SocketHandlers.deleteShape(this.ExistingShapes[shapeIndex].id ) ;
                }
            }
            this.lastX = this.startX ;
            this.lastY = this.startY ; 
        },

        setEndingCoords : (e: globalThis.MouseEvent) => { // pointerup
            this.selected = false ; 
            if(this.ShapeSelected == "Text") return ;
            if(this.ShapeSelected == "Move" || this.ShapeSelected == "Update"){
                if(this.ShapeSelectedIndex >= 0){

                  // deleting existing coords keys of this shape
                  this.CoordShapeIndexMap.forEach((value: number, key: string) =>{
                        if(value == this.ShapeSelectedIndex) this.CoordShapeIndexMap.delete(key) ;                      
                  })

                  this.insertIntoCoordShapeIdMap(this.ExistingShapes[this.ShapeSelectedIndex].shape,this.ShapeSelectedIndex) ;
                  this.SocketHandlers.updateShape(this.ExistingShapes[this.ShapeSelectedIndex].shape,this.ExistingShapes[this.ShapeSelectedIndex].id)
                  this.ShapeSelectedIndex = -1 ;
                  this.infinite.draw() ;
                }
                return ; 
            }

            this.EndX = e.clientX ; 
            this.EndY = e.clientY ; 

            const rStartX = this.infinite.ToXReal(this.startX) ;
            const rStartY = this.infinite.ToYReal(this.startY) ; 
            const rEndX   = this.infinite.ToXReal(this.EndX) ;
            const rEndY   = this.infinite.ToYReal(this.EndY) ; 

            let shape : Shape | null = null ;
            if(this.ShapeSelected == "Circle")    shape = this.canvasShape.createCircle(rStartX,rStartY,rEndX,rEndY)
            else if(this.ShapeSelected == "Line") shape = this.canvasShape.createLine(rStartX,rStartY,rEndX,rEndY)
            else if(this.ShapeSelected == "Rectangle") shape = this.canvasShape.createRectangle(rStartX,rStartY,rEndX,rEndY)
            else if(this.ShapeSelected == "Pencil") shape = this.canvasShape.createPencil() ;

            if(!shape) return ;

            let l = this.ExistingShapes.length ; 
            this.insertIntoCoordShapeIdMap(shape,l-1) ;
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

            if(this.ShapeSelected == "Move"){
                const dx = ((e.clientX) - (this.lastX))/this.infinite.scale  ; 
                const dy = ((e.clientY) - (this.lastY))/this.infinite.scale  ;

                if(this.ShapeSelectedIndex >= 0){
                    if((this.ExistingShapes[this.ShapeSelectedIndex].shape as Shape).type == 'Pencil'){
                        const UpdatedCoords = (this.ExistingShapes[this.ShapeSelectedIndex].shape as Shape).coords.map(({x,y} : Coordinate) : Coordinate => 
                            {
                                return {x : x + dx,  y : y + dy}
                            }
                        )
                        this.ExistingShapes[this.ShapeSelectedIndex].shape.coords = UpdatedCoords ;
                    }
                    else {
                        this.driftX += dx ; this.driftY += dy ;
                        this.ExistingShapes[this.ShapeSelectedIndex].shape.startXY.x += dx ; 
                        this.ExistingShapes[this.ShapeSelectedIndex].shape.startXY.y += dy ; 
                        this.ExistingShapes[this.ShapeSelectedIndex].shape.endXY.x   += dx ; 
                        this.ExistingShapes[this.ShapeSelectedIndex].shape.endXY.y   += dy ; 
                    }
                }
                else{
                    this.infinite.offsetX += dx ;
                    this.infinite.offsetY += dy ;
                }
                this.infinite.draw() ;
                this.lastX = e.clientX ; 
                this.lastY = e.clientY ;
            }
            else if(this.ShapeSelected == "Rectangle") this.canvasShape.renderRectangle(this.startX,this.startY,width,height) ;
            else if(this.ShapeSelected == "Line") this.canvasShape.renderLine(this.startX,this.startY,e.clientX,e.clientY) ;
            else if(this.ShapeSelected == "Pencil"){ 
                this.Coords.push({x : e.clientX, y : e.clientY}) ;
                this.canvasShape.renderPencil(this.Coords) ;
            } 
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
            if(this.ShapeSelected != "Text" || this.clickCount == 0) return ;
            if(e.key == "Backspace") {
                this.text = this.text.slice(0,this.textIndex-1) + this.text.slice(this.textIndex,this.text.length) ;
                if(this.textIndex == 0) return ;
                this.textIndex -- ;
            }
            else if(e.key == "Enter") this.text += "\n" ; 
            else if(e.key == "Escape"){
                if(this.text.length != 0){  
                const rStartX = this.infinite.ToXReal(this.startX) ;
                const rStartY = this.infinite.ToYReal(this.startY) ; 
                const shape = this.canvasShape.createTextBox(this.text,rStartX,rStartY) ;

                let l = this.ExistingShapes.length ; 
                this.insertIntoCoordShapeIdMap(shape,l-1) ;
                this.SocketHandlers.createShape(shape)  ; 

                this.text = "" ; 
                this.textIndex = 0 ;
                this.clickCount = 0 ;
                }
                this.infinite.draw() ;
                return ;
            }
            else if(e.key == "ArrowRight"){
                if(this.textIndex == this.text.length) return ;
                this.textIndex ++ ; 
            }
            else if(e.key == "ArrowLeft"){
                if(this.textIndex == 0) return ;
                this.textIndex-- ; 
            }
            else if(e.key.length == 1){ 
                this.text = this.text.slice(0,this.textIndex) + e.key + this.text.slice(this.textIndex,this.text.length)
                this.textIndex++ ; 
            }
            
            this.infinite.draw() ;
            // this.canvasShape.renderTextBox(this.text,this.startX,this.startY) ;
            const tempText =  this.text.slice(0,this.textIndex) + "|" + this.text.slice(this.textIndex,this.text.length) ;
            this.canvasShape.renderTextBox(tempText,this.startX,this.startY) ;
        }
    }


    initKeyEvents = () =>{
        this.canvas.addEventListener("keydown",this.KeyEventHandler.onkeydown) ; 
    }

    private canvasShape = {
        createRectangle : (startX : number,startY : number,endX : number,endY : number) : Shape | null => {
            if(startX == endX && startY == endY) return null ; 
            const shape : Shape = {
                type : "Rectangle",
                startXY : {x : startX , y : startY},
                endXY   : {x : endX , y : endY},
                coords  : []
            };  
            return shape ;
        },
        renderRectangle :  (startX : number,startY : number,width : number,height : number) => {
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

        createCircle : (startX : number,startY : number,endX : number,endY : number) : Shape | null =>{
            
            const radiusX = endX - startX ;  
            const radiusY = endY - startY ;  
                    
            if(radiusX <= 0 || radiusY <= 0) return null ;    

            const centerX = startX + radiusX/2 ; 
            const centerY = startY + radiusY/2 ; 

            const coords = this.canvasShape.getCircleCoords(centerX,centerY,radiusX,radiusY) ;
                
            const shape : Shape ={
                type : "Circle",
                startXY : {x : startX , y : startY},
                endXY   : {x : endX , y : endY},
                coords  : coords
            }; 

            return shape ;
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
            const shape : Shape = {
                type : "Line",
                startXY : {x : startX , y : startY},
                endXY   : {x : endX , y : endY},
                coords  : []
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
            // const coords : Coordinate[] = this.canvasShape.getTextBoxCoords(text,startX,startY) ;
            // const l : number = coords.length ;
            
            const shape : Shape = {
                type    : "Text",
                text    : text ,
                startXY : {x : startX , y : startY},
                endXY   : {x : startX  , y : startY},  // will be updated when shape comes from DB
                coords  : []
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
                y += (this.fontSize + 2 ); 
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
            let shape : Shape , shapeId : number , shapeIndex : number ;

            switch(parsedData.resType){
                case "delivered-shape" : 
                    shape = parsedData.shape ;
                    this.ExistingShapes.push({shape : shape , id : parsedData.shapeId}) ;
                    this.insertIntoCoordShapeIdMap(shape,this.ExistingShapes.length-1) ;
                    this.infinite.draw() ; 
                break ;

                case "deleted-shape" : 
                    shapeId = parsedData.shapeId ;
                    shapeIndex = this.ExistingShapes.findIndex((s : { shape : Shape , id : number} | null) => { 
                        if(s) return (s.id == shapeId ) ;
                    }) ; 
                    this.ExistingShapes[shapeIndex] = null ;
                    this.CoordShapeIndexMap.forEach((value: number, key: string) =>{
                        if(value == shapeIndex) this.CoordShapeIndexMap.delete(key) ;
                    })

                    this.infinite.draw() ; 
                break ;

                case "updated-shape" : 
                    shape = parsedData.shape ;  // updated shape 
                    shapeId = parsedData.shapeId ; 
                    shapeIndex = this.ExistingShapes.findIndex((s : {shape : Shape,id : number}) => s.id == shapeId) ;
                    if(shapeIndex != -1){
                        // Delete Exisisting coordinates 
                        this.CoordShapeIndexMap.forEach((value: number, key: string) =>{
                            if(value == shapeIndex) this.CoordShapeIndexMap.delete(key) ;                      
                        })

                        this.ExistingShapes[shapeIndex].shape = shape ;

                        // updating coords
                        this.insertIntoCoordShapeIdMap(this.ExistingShapes[this.ShapeSelectedIndex].shape,this.ShapeSelectedIndex) ;
                    }
            }} ;  
        },
        createShape : (shape : Shape) =>{
            this.socket.send(JSON.stringify({
                reqType :  "send-shape",
                roomId  :  this.roomId,
                shape   :  shape 
            }))
        },
        deleteShape : (shapeId : number) =>{
            this.socket.send(JSON.stringify({
                reqType :  "delete-shape",
                roomId  :  this.roomId,
                id      :  shapeId,
            }))
        },
        updateShape : (shape : Shape,shapeId : number) =>{
            if(["Rectangle","Circle","Line"].some((s) => s == shape.type)) shape.coords = [] ;

            this.socket.send(JSON.stringify({
                reqType :  "update-shape",
                roomId  :  this.roomId,
                id :       shapeId,
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
        this.ExistingShapes.forEach((s : {shape : Shape } | null ) => {
            if(s == null) return  // skip 
            const shape = s.shape ;
            const vStartX = this.infinite.ToXVirtual(shape.startXY.x) ; 
            const StartY = this.infinite.ToYVirtual(shape.startXY.y) ;

            const vEndX = this.infinite.ToXVirtual(shape.endXY.x) ; 
            const vEndY = this.infinite.ToYVirtual(shape.endXY.y) ;

            const Width = this.infinite.virtualWidth(shape.endXY.x - shape.startXY.x) ;
            const Height = this.infinite.virtualHeight(shape.endXY.y - shape.startXY.y) ;

            const vCoords = shape.coords.map((coord : Coordinate) => {
                return {x : this.infinite.ToXVirtual(coord.x),y : this.infinite.ToYVirtual(coord.y)}
            }) 

            if(shape.type == "Rectangle") this.canvasShape.renderRectangle(vStartX,StartY,Width,Height)
            else if(shape.type == 'Circle') this.canvasShape.renderCircle(vStartX + Width/2,StartY + Height/2,Width,Height)
            else if(shape.type == 'Line') this.canvasShape.renderLine(vStartX,StartY,vEndX,vEndY)
            else if(shape.type == "Pencil") this.canvasShape.renderPencil(vCoords) ;         
            else if(shape.type == "Text") this.canvasShape.renderTextBox(shape.text,vStartX,StartY) ; 
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