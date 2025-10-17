import express from "express"
import bcrypt  from "bcrypt" 
import jwt  from "jsonwebtoken" 
import cors from "cors"
import { JWT_EXPIRE_TIME, JWT_SECRET, SaltRounds } from "@repo/backend-common/config";
import { authMiddleWare } from "./auth"
import { zodSignUpSchema , zodSignInSchema , zodCreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client"

const app = express() ; 
app.use(express.json()) ;
app.use(cors()) ; 
 

app.post("/api/v1/signup",async(req,res) =>{
    const result = await zodSignUpSchema.safeParseAsync(req.body) ;

    if(!result.success){
        res.status(411).send({
            message : result.error.message
        })
        return ; 
    }

    const username : string = result.data.username ; 
    const password : string = result.data.password ;
    const photoUrl : string = result.data.photoUrl ?? "" ;
    const email    : string = result.data.email    ;

    const hashedPassword : string = await bcrypt.hash(password,SaltRounds) ; 

    try{
        await prismaClient.user.create({
        data : {
                username : username ,
                password : hashedPassword ,
                email    : email  ,
                photo    : photoUrl 
            }
        }) ;

        res.status(200).json({
            message : "sign up successfull"  
        })
    }
    catch(e){
        res.status(411).json({
            message : "user with this email already exists"  
        })
    }
})

 
app.post("/api/v1/signin",async(req,res) =>{

    const result = await zodSignInSchema.safeParseAsync(req.body) ;

    if(!result.success){
        res.status(411).send({
            message : "wrong username or password!"
        })
        return ; 
    }

    const email    : string = result.data.email ; 
    const password : string = result.data.password ;

    const user = await prismaClient.user.findFirst({
        where : {
            email : email ,
        }
    })

    if(user == null){
        res.status(411).send({
            message : "You are not Signed Up!",
            signup  :  false 
        })
        return ;
    }

    const passVerify : boolean = await bcrypt.compare(password,user.password) ;  // db hashed password

    if(!passVerify){ 
        res.status(411).json({
            message : "wrong email or password!"  
        })
    }

    const token : string = jwt.sign({   
        userId : user.id
    },JWT_SECRET,{
        expiresIn : JWT_EXPIRE_TIME ?? "4h"
    }) ;

    res.setHeader("token",token) ;
    res.status(200).json({
        token    : token,
        username : user.username,
        message  : "sign in successfull"  ,
    })
})


app.post("/api/v1/room/create",authMiddleWare,async(req,res) =>{
    const result = await zodCreateRoomSchema.safeParseAsync(req.body) ;

    if(!result.success){
        res.status(403).json({
            message : result.error.message 
        })  
        return ; 
    }

    const userId : string = req.headers.userId as string ;
    const slug   : string = result.data.slug ;

    try{
        const room = await prismaClient.room.create({
            data : {
                slug    : slug ,
                adminId : userId
            }
        })
        res.status(200).json({
            roomId  : room.id ,
            message : "room created" 
        })
    }
    catch(e){
       res.status(403).json({
            message : "Error this slug is already exists !" 
        })
    }
})

app.get("/api/v1/room/chats/:roomId",authMiddleWare,async(req,res) =>{
    const roomId : string = req.params.roomId  as string   ; 

    let chats = await prismaClient.chat.findMany({
        where : {
            roomId : roomId
        },
        select : {
            message : true 
        },
        orderBy :{
            id : "desc"
        },
        take : 50 // 50 messages will come 
    })

    res.status(200).json({
        chats   :  chats,
        message :  "last 50 chats retrived" 
    })
})


app.get("/api/v1/room/shapes/:roomId",authMiddleWare,async(req,res) =>{
    const roomId : string = req.params.roomId  as string   ; 

    let shapes = await prismaClient.shape.findMany({
        where : {
            roomId : roomId
        },
        select : {
            shape : true 
        },
        orderBy :{
            id : "desc"
        }
    })

    res.status(200).json({
        shapes    :  shapes,
        message   :  "shape retrived" 
    })
})

app.get("/api/v1/room",authMiddleWare,async(req,res) =>{
    const userId : string = req.headers.userId as string ;
    let rooms : any[] = [] ;

    try{
        rooms = await prismaClient.room.findMany({
            where : {
                adminId : userId 
            }
        })

        res.status(200).json({
            rooms   :  rooms ,
            message :  "all rooms retrived" 
        })
    }
    catch(e){
        res.status(500).json({
            rooms  :   rooms ,
            message :  "failed to talk to backend !!" 
        })     
        return ;
    }
})

app.get("/api/v1/room/:slug",authMiddleWare,async(req,res) =>{
    const slug : string = req.params.slug  as string   ; 
    const userId : string = req.headers.userId as string ;

    try{
        let room = await prismaClient.room.findFirst({
            where : {
                slug : slug
            }
        })

        if(room == null){
            res.status(404).json({
                message     :  "no such room exists!" 
            })     
            return ;
        }
        res.status(200).json({
            room    :  room,
            message :  "room retrieved" 
        })
    }
    catch(e){
        res.status(500).json({
            message :  "failed to talk to backend !!" 
        })     
        return ;
    } 

})

app.listen(3001) ;