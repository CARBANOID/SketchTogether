import { EXPRESS_SERVER_URL } from "@/config";
import axios from "axios";
import { useEffect, useState } from "react";

export const useGetRooms = () =>{
  const [rooms,setRooms] = useState<any[]>() ;
  const RefreshRooms = async() =>{
    const response = await axios.get(`${EXPRESS_SERVER_URL}/api/v1/room`,{
     headers : {
      token : localStorage.getItem("token") 
     },
     validateStatus : (staus) => true
    }) ; 
    setRooms(response.data.rooms) ;
    return response.data.rooms ;
  }

  useEffect(()=>{
    RefreshRooms() ;
  },[])
  return {rooms,setRooms,RefreshRooms} ;
}

