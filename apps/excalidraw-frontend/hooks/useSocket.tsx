import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket(){
    const [socket  , setSocket]  = useState<WebSocket>() ; 

    useEffect(() =>{
        const token : string = localStorage.getItem("token") ?? "" ;
        const ws = new WebSocket(`${WS_URL}?token=${token}`) ;
        ws.onopen = () => {
            setSocket(ws) ; 
        }
        return () => ws.close() ;
    },[])

    return {socket}
}
