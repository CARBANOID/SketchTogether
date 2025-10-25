"use client"
import { useEffect, useRef, useState } from "react"
import {ShapeLabelType, ShapeSelectBar} from "./ui/ShapeOptions"
import { Game } from "@/draw/Game";

export function Canvas({ roomId , socket } : { roomId : string , socket : WebSocket } ){
    const canvasRef = useRef<HTMLCanvasElement>(null) ; 
    const [ShapeSelected,setShape] = useState<ShapeLabelType>("Move") ; 
    const SelectShape = (shape: ShapeLabelType) => setShape(shape)

    const [game,setGame] = useState<Game>() ;

    useEffect(() =>{
      if(!game) return ;
      game.SelectShape(ShapeSelected) ;
    },[ShapeSelected]) ;

    useEffect(() =>{         
        if(!canvasRef.current) return ;

        const canvas = canvasRef.current ;
        const cxt : CanvasRenderingContext2D | null = canvas.getContext("2d") ;

        canvas.width =  window.innerWidth ;
        canvas.height = window.innerHeight ;

        if(!cxt) return ; 
        
        const g = new Game(canvas,cxt,roomId,socket) ; 
        g.SelectShape(ShapeSelected) ;
        
        setGame(g) ;

        return () => g.cleanup() ;
    },[roomId,socket])  

    return(
        <div className={`${(ShapeSelected == "Move") ? "cursor-grab" : (ShapeSelected == "Update") ? "":"cursor-crosshair"} `}>
        <ShapeSelectBar ShapeSelected={ShapeSelected} SelectShape={SelectShape}/>
        <canvas ref={canvasRef} tabIndex = {0} width={document.body.clientWidth} height={document.body.clientHeight}> </canvas>
        </div>
    )
}

