import  ws,{ WebSocketServer } from "ws";
import  { IncomingMessage } from 'http'
import  { AuthPayload, AuthUser } from "./auth";
import  { prismaClient } from "@repo/db/client"
import  { Queue } from "./queue";
import  { Shape } from "@repo/common/GameShapes"
 
const messageInsertQueue = new Queue() ; 
const messageUpdateQueue = new Queue() ; 
const messageDeleteQueue = new Queue() ; 

const shapeInsertQueue = new Queue() ; 
const shapeUpdateQueue = new Queue() ; 
const shapeDeleteQueue = new Queue() ; 

const wsClient = new WebSocketServer( { 
    port : 3002 
} ) ;

type RoomSocketArrayRecord = Record<string,Array<ws>> ;
type UserRoomArrayRecord   = Record<string,Array<string>> ;
let LastShapeId : number = 0 ; 
let LastMessageId : number = 0 ; 

// type SocketUserIdMapping   = Map<ws,string> ;

let RoomSocketArray : RoomSocketArrayRecord = {} ;
let UserRoomArray   : UserRoomArrayRecord   = {} ;
// let SocketUserIdMap : SocketUserIdMapping   = new Map() ;

type SocketPayLoad = {
    reqType  : string,
    roomId   : string,
    id?       : number,
    message? : string,
    shape?   : Shape,
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
            
            const LastShapeRecord = await prismaClient.shape.findFirst({
                orderBy : {
                    id : "desc"
                },
                select : {
                    id : true
                },
                take : 1
            })

            if(LastShapeRecord) LastShapeId = LastShapeRecord.id ;

            const LastMessageRecord = await prismaClient.chat.findFirst({
                orderBy : {
                    id : "desc"
                },
                select : {
                    id : true
                },
                take : 1
            })

            if(LastMessageRecord) LastMessageId = LastMessageRecord.id ; 
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
                    id      : ++LastMessageId,
                    userId  : userId,
                    message : message,
                    roomId  : roomId
                }

                messageInsertQueue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => s.send(JSON.stringify({
                    resType : "delivered-chat",
                    roomId  : roomId ,
                    chatId  : LastMessageId,
                    chat    : message
                }))) ; 

                while(messageInsertQueue.length() != 0) {
                    const ele : any =  messageInsertQueue.front() ;
                    try{
                        await prismaClient.chat.create( { data : ele } ) ;
                        messageInsertQueue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : "failed to push message in database !! ",
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
                    id : ++LastShapeId,
                    userId  : userId,
                    shape   : shape,
                    roomId  : roomId
                }

                shapeInsertQueue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => s.send(JSON.stringify({
                    resType : "delivered-shape",
                    roomId  : roomId ,
                    shapeId : LastShapeId ,
                    shape   : shape
                }))) ; 

                while(shapeInsertQueue.length() != 0) {
                    const ele : any =  shapeInsertQueue.front() ;
                    try{
                        await prismaClient.shape.create( { data : ele } ) ;
                        shapeInsertQueue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : "failed to push shape in database !! ",
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
        else if(reqType == "delete-shape"){
            if(UserRoomArray[userId]!.includes(roomId)){
                const shapeId : number | undefined = payload.id ;

                if(typeof shapeId == "undefined"){
                    socket.send(JSON.stringify({
                        resType : "shape-undefined",
                        message : "undefined shapeId"
                    }))                      
                    return ;
                }

                const data = {
                    id : shapeId ,
                    roomId : roomId 
                } ;
                shapeDeleteQueue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => s.send(JSON.stringify({
                    resType : "deleted-shape",
                    roomId  : roomId ,
                    shapeId : shapeId ,
                }))) ; 

                while(shapeDeleteQueue.length() != 0) {
                    const ele : any =  shapeDeleteQueue.front() ;
                    try{
                        await prismaClient.shape.delete( { where : ele } ) ;
                        shapeDeleteQueue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : `failed to delete shape with id : ${shapeId} in database !! `,
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
        else if(reqType == "update-shape"){
            if(UserRoomArray[userId]!.includes(roomId)){

                const shape : Shape | undefined = payload.shape ; 
                const shapeId : number | undefined = payload.id ;

                if(typeof shape == "undefined" || shape == null || typeof shapeId == "undefined"){
                    socket.send(JSON.stringify({
                        resType : "shape-undefined",
                        message : "undefined shape/shapeId"
                    }))                      
                    return ;
                }

                const data = {
                    id  : shapeId ,
                    roomId : roomId ,
                    shape : shape  
                } ;

                shapeUpdateQueue.push(data) ; 

                RoomSocketArray[roomId]!.forEach( (s : ws) => (s != socket) ? s.send(JSON.stringify({
                    resType : "updated-shape",
                    roomId  : roomId ,
                    shapeId : shapeId ,
                    shape   : shape  
                })) : null) ; 

                while(shapeUpdateQueue.length() != 0) {
                    const ele : any =  shapeUpdateQueue.front() ;
                    try{
                        await prismaClient.shape.update( 
                            { 
                                where : { 
                                    id : ele.id ,
                                    roomId : ele.roomId
                                } , 
                                data : {
                                    shape : ele.shape
                                } 
                            }
                        ) ;

                        shapeUpdateQueue.pop() ;
                    }
                    catch(e){
                        console.log({
                            error   : `failed to update shape with id : ${shapeId} in database !! `,
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