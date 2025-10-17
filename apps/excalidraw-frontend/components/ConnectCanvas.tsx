"use client"
import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react"
import Loader from "./Loading";
import { Canvas } from "./Canvas";

export function ConnectCanvas({ roomId  } : { roomId : string } ){
    const {socket} = useSocket() ; 
 
    useEffect(() =>{
        if(socket) {
            return () => socket.close()
        }
    },[socket]) ;

    useEffect(() =>{
        if(!socket) return ;
        socket.send(JSON.stringify({
            reqType : "join-room",
            roomId  : roomId 
        })) ; 

        return () => {
            socket.send(JSON.stringify({
              reqType : "leave-room",
              roomId  : roomId 
            })) ; 
        }
    },[roomId,socket])

    if(!socket) return <Loader/>

    return(
        <Canvas roomId={roomId} socket={socket}/>
    )
}