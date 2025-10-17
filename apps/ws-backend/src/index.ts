import  ws,{ WebSocketServer } from "ws";
import  { IncomingMessage } from 'http'
import  { AuthPayload, AuthUser } from "./auth";
import  { prismaClient } from "@repo/db/client"
import  { Queue } from "./queue";
import  { Shape } from "@repo/common/GameShapes"
 
const queue = new Queue() ; 

const wsClient = new WebSocketServer( { 
    port : 3002 
} ) ;

type RoomSocketArrayRecord = Record<string,Array<ws>> ;
type UserRoomArrayRecord   = Record<string,Array<string>> ;
// type SocketUserIdMapping   = Map<ws,string> ;

let RoomSocketArray : RoomSocketArrayRecord = {} ;
let UserRoomArray   : UserRoomArrayRecord   = {} ;
// let SocketUserIdMap : SocketUserIdMapping   = new Map() ;

type SocketPayLoad = {
    reqType  : string,
    roomId   : string,
    message? : string,
    shape?   : Shape
}

wsClient.on("connection",(socket : ws,request : IncomingMessage) =>{
    const wsUrl = request.url ;
    if(!wsUrl){
        socket.close() ;
        return ; 
    } 

    const queryParams = new URLSearchParams(wsUrl.split('?')[1]) ; 
    const token  = queryParams.get("token") ;

    if(!token || token.length == 0){
        socket.close() ;
        return ;
    }

    const {userId , Error} : AuthPayload = AuthUser(token) ;

    if(Error){
        socket.send(JSON.stringify(Error)) ;
        socket.close() ;
        return ;
    }

    UserRoomArray[userId] = [] ; 

    socket.on("message", async(data : ws.RawData) =>{
        const payload : SocketPayLoad = JSON.parse(data.toString()) ; 
        const reqType : string = payload.reqType ;
        const roomId  : string = payload.roomId  ;

        if(reqType == "join-room"){
            UserRoomArray[userId]!.push(roomId) ;
            
            if(typeof RoomSocketArray[roomId] == "undefined") RoomSocketArray[roomId] = [] ;

            RoomSocketArray[roomId].push(socket)! 
            socket.send(JSON.stringify({
                resType : "joined-room",
                roomId  : roomId,
                message : "room joined"
            }))
        }
        else if(reqType == "send-chat"){
            if(UserRoomArray[userId]!.includes(roomId)){
                const message : string | undefined = payload.message ; 

                if(typeof message == "undefined"){
                    socket.send(JSON.stringify({
                        resType : "message-undefined",
                        message : "undefined data"
                    }))                      
                    return ;
                }

                const data = {
                    userId  : userId,
                    message : message,
                    roomId  : roomId
                }

                queue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => (s != socket) ? s.send(JSON.stringify({
                    resType : "delivered-chat",
                    roomId  : roomId ,
                    chat    : message
                })) : "") ; 

                while(queue.length() != 0) {
                    const ele : any =  queue.front() ;
                    try{
                        await prismaClient.chat.create( { data : ele } ) ;
                        queue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : "failed to push message in database !! ",
                            message : ele.message,
                            e
                        })
                    }
                }
            }
            else{
                socket.send(JSON.stringify({
                    resType : "not-in-room" ,
                    message : "You are not part of this Room"
                }))
            }
        }
        else if(reqType == "send-shape"){
            if(UserRoomArray[userId]!.includes(roomId)){
                const shape : Shape | undefined = payload.shape ; 

                if(typeof shape == "undefined" || shape == null){
                    socket.send(JSON.stringify({
                        resType : "shape-undefined",
                        message : "undefined shape"
                    }))                      
                    return ;
                }

                const data = {
                    userId  : userId,
                    shape   : shape,
                    roomId  : roomId
                }

                queue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => (s != socket) ? s.send(JSON.stringify({
                    resType : "delivered-shape",
                    roomId  : roomId ,
                    shape   : shape
                })) : "") ; 

                while(queue.length() != 0) {
                    const ele : any =  queue.front() ;
                    try{
                        await prismaClient.shape.create( { data : ele } ) ;
                        queue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : "failed to push shape in database !! ",
                            message : ele.message,
                            e
                        })
                    }
                }
            }
            else{
                socket.send(JSON.stringify({
                    resType : "not-in-room" ,
                    message : "You are not part of this Room"
                }))
            }
        }
        else if(reqType == "leave-room"){
            const roomIndex = UserRoomArray[userId]!.indexOf(roomId) ;
            UserRoomArray[userId]!.splice(roomIndex,1) ;

            const socketIndexinRoom = RoomSocketArray[roomId]!.indexOf(socket) ;
            RoomSocketArray[roomId]!.splice(socketIndexinRoom,1) ; 

            socket.send(JSON.stringify({
                resType : "left-room",
                roomId  :  roomId,
                message : "room left"
            }))
        }
    })
    
})