"use client"

import { useGetRoomId } from "@/hooks/useGetRoomId"
import Loader from "./Loading";
import { notFound } from "next/navigation";
import { ConnectCanvas } from "./ConnectCanvas";

export function Room({slug} : {slug : string}){
    const {roomId,status} = useGetRoomId(slug) ;
    
    if(status != 200) notFound() ;
    if(!roomId) return <Loader/> ; 
    
    return <ConnectCanvas roomId = {roomId}/>
}