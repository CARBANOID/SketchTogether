"use client"
import { ConnectCanvas } from "@/components/ConnectCanvas";
import { SideBar } from "@/components/SideBar";
import { useState } from "react";

export default function ChatRoom() {
  const [roomId, setRoomId] = useState<string>();
  const propagateRoomId = (selectedRoomId: string) => setRoomId(selectedRoomId);
  return (
    <div>
      <SideBar propagateRoomId={propagateRoomId}/>
      <div className="bg-black min-w-screen w-full min-h-screen h-full">
          {roomId && <ConnectCanvas roomId={roomId}/>}
      </div>
    </div>
  );
}
