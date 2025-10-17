"use client"
import { useRef, useState } from "react";
import { Search, LogOut ,PlusCircle,HousePlus,Settings,SidebarClose,SidebarOpen ,XSquare ,CheckSquare2} from "lucide-react";
import { useGetRooms } from "@/hooks/useGetRooms";
import Loader from "./Loading";
import { useRouter } from "next/navigation";
import { Input } from "./ui/Input";
import axios from "axios";
import { EXPRESS_SERVER_URL } from "@/config";

export function SideBar({propagateRoomId} : {propagateRoomId : (selectedRoomId: string) => void}){
  let { rooms,setRooms,RefreshRooms } = useGetRooms();

  const [Toggle,setToggle] = useState<boolean>(false); 
  const ToggleSideBar = () => setToggle(!Toggle) ;


  const router = useRouter() ;
  const Logout = () =>{ 
    localStorage.removeItem("shortname") ;
    localStorage.removeItem("token") ;
    router.push("/") ;
  }

  const slugRef = useRef<HTMLInputElement>(null);

  const [addRoom,setAddRoom]   = useState<boolean>(false) ;
  const [joinRoom,setJoinRoom] = useState<boolean>(false) ; 

  const ToogleRoom = (type : boolean) => {
    if(type) setAddRoom(!addRoom)  // 1 Create a Room
    else setJoinRoom(!joinRoom) ;  // 0  Join a Room
  } ;

  const CreateRoom = async() =>{
    if(slugRef.current == null) return ;
    if(slugRef.current.value == ""){
      slugRef.current.focus() ;
      return ;
    }
    const response = await axios.post(`${EXPRESS_SERVER_URL}/api/v1/room/create`,{
        slug : slugRef.current.value
      },
      {
        headers : {
          token : localStorage.getItem("token") 
        },
        validateStatus : (status) => true
      },
    )
    if(response.status != 200) window.alert(response.data.message) ; 
    else {
      rooms = await RefreshRooms() ;
      setAddRoom(false) ;
    }
  }

  const JoinRoom = async() =>{
    if(slugRef.current == null || !rooms) return ;
    if(slugRef.current.value == ""){
      slugRef.current.focus() ;
      return ;
    }

    rooms.forEach((room) => {
      if(room.slug == slugRef.current!.value){
          window.alert("You have already joined this room") ;
          return ;
      }
    }) 

    const response = await axios.get(`${EXPRESS_SERVER_URL}/api/v1/room/${slugRef.current.value}`,
      {
        headers : {
          token : localStorage.getItem("token") 
        },
        validateStatus : (status) => true
      },
    )

    if(response.status != 200) window.alert(response.data.message) ; 
    else{
      setRooms([...rooms,response.data.room]) ;
      setJoinRoom(false) ;
    }
  }
  
  if(typeof rooms == "undefined") return <Loader/>

  return (
    <div className={`fixed top-0 left-0 max-h-screen transition-all duration-1000 ${Toggle ? "max-w-10" : "max-w-95" }  w-full h-full bg-[#1e2128] flex`}>
      {/* Left Navigation */}
      <div className="p-2 bg-[#17191d] flex flex-col items-center py-6 gap-6">
        <div className="w-10 h-10 bg-[#2a2d35] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">{localStorage.getItem("shortname")}</span>
        </div>
        
        <div className="flex flex-col gap-4">
          <div onClick={ToggleSideBar}> <NavIcon icon={(Toggle) ? SidebarOpen : SidebarClose} label="Close"/> </div>
          <div onClick={() => ToogleRoom(true)}><NavIcon icon={PlusCircle} label="Create Room" /> </div>
          <div onClick={() => ToogleRoom(false)}><NavIcon icon={HousePlus} label="Join Room"/></div>
          <div onClick={Logout}><NavIcon icon={LogOut} label="Logut" /> </div>
        </div>
        
        <div className="mt-auto">
          <NavIcon icon={Settings} label="Settings" />
        </div>
      </div>

      <div className={`transition-all  ${Toggle ? "duration-[200ms] opacity-0  pointer-events-none" : "duration-[3000ms] opacity-100" } flex-1 flex flex-col`}>
       
        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <Input
              inputVaraint="TextBox"
              size ="sm" 
              type="text"
              placeholder="Search"
              customStyle="w-full bg-[#2a2d35] text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
          </div>
        </div>
        
        {
          (addRoom || joinRoom) 
          && 
          <div className="ml-4 mr-4 mb-4">
            <Input
              ref={slugRef}
              inputVaraint="TextBox"
              size ="md" 
              type="text"
              placeholder={`${(addRoom) ? "New Room Name" : (joinRoom) ? "Join Room Name" : ""} `}
              customStyle="w-full bg-[#2a2d35] pr-15 text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              
            />
            <div className="fixed -mt-[32px] flex m-59 gap-[2px]">
              <div className="text-indigo-800 cursor-pointer" onClick={() => {
                  if(addRoom) setAddRoom(false) ;
                  else if(joinRoom) setJoinRoom(false) ;
                }}> 
                <XSquare/> 
              </div>
              <div className="text-indigo-800 cursor-pointer" onClick={ () => {
                if(addRoom) CreateRoom()
                else if(joinRoom) JoinRoom() ;
                }}> 
                <CheckSquare2/> 
              </div>
            </div>
          </div>
        } 

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room, index) => (
            <RoomItem 
              key={`${room.id}${index}`} 
              roomId={room.id} 
              roomName={room.slug}  
              onClick={propagateRoomId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function NavIcon({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className="group relative flex items-center justify-center">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
        active ? 'bg-[#3b82f6] text-white' : 'text-[#6b7280] hover:bg-[#2a2d35]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="absolute left-14 bg-[#2a2d35] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

type RoomItemProps = {
    roomId: string;
    avatar?: string;
    roomName: string;
    onClick: (selectedRoomId: string) => void;
}

function RoomItem(props: RoomItemProps) {
  // Generate random color for avatar placeholder
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a2d35] cursor-pointer transition-colors group"
      onClick={() => props.onClick(props.roomId)}
    >
      
      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-semibold bg-gray-500"
      >
        {props.roomName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-medium text-sm truncate">{props.roomName}</h3>
          {/* <span className="text-[#6b7280] text-xs flex-shrink-0 ml-2">9:31 am</span> */}
        </div>
        {/* <p className="text-[#6b7280] text-sm truncate">Our company needs to prepare</p> */}
      </div>

    </div>
  );
}
