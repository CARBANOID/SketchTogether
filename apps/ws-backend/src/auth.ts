import  jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken"
import  {JWT_SECRET} from "@repo/backend-common/config";

export type AuthError = {
    message : string ,
    logout  : boolean 
} | null

export type AuthPayload =  {
    userId : string,
    Error  : AuthError
} 

export const AuthUser = (token : string) : AuthPayload =>{
    let Error  : AuthError = null ; 
    let userId : string    = "" ;

    jwt.verify(token,JWT_SECRET,(error : VerifyErrors | null ,payload? : JwtPayload | string) => {
        if(error){
            if(error instanceof jwt.TokenExpiredError){
                // can also refresh the Token
                Error = {
                    message : "Token Expired !",
                    logout   : true
                }
            }
            else{
                Error = {
                    message : "unauthorized access !! please sign in first !",
                    logout : true ,
                }  
            }
            return  ; 
        } 

        if(typeof payload == "string" || typeof payload == "undefined" ){
            Error = {
                message : "Incorrect payload!",
                logout : true 
            }
            return ;
        }

        userId = payload.userId  
    })

    return  {userId , Error} ;
}
