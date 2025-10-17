"use client"
import axios from "axios";
import { EXPRESS_SERVER_URL } from "../config";
import { useEffect, useState } from "react";

export const useGetRoomId = (slug : string) =>{
    const [roomId,setRoomId] = useState<string>() ;
    const [status,setStatus] = useState<number>(200) ;

    const refreshRoomId = async() =>{
        const response = await axios.get(`${EXPRESS_SERVER_URL}/api/v1/room/${slug}` ,{
            headers : {
                token : localStorage.getItem("token") 
            },
            validateStatus : (statusCode) =>  { 
                setStatus(statusCode) ;
                return true ;
            } 
        })
        setRoomId(response.data.roomId) ;
        return response.data.roomId ;  
    }

    useEffect(() =>{
        refreshRoomId() ;
    },[])

    return {roomId,status} ;
}
