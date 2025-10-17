"use client"
import { useRef, useState } from "react"
import axios from "axios";
import { EXPRESS_SERVER_URL } from "../../excalidraw-frontend/config";
import { useRouter } from "next/navigation";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import gradientBg from "./ui/assests/ExcalidrawImage.png"
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export const AuthBox = ( { mode } : { mode : boolean}) => { // true = Sign In, false = Sign Up
    const passRef    = useRef<HTMLInputElement>(null) ; 
    const userRef    = useRef<HTMLInputElement>(null) ; 
    const mailRef    = useRef<HTMLInputElement>(null) ; 
    const messageRef = useRef<HTMLDivElement>(null) ;
    const [showPassword, setShowPassword] = useState(false);
    
    const router  = useRouter() ;

    const SignIn = async() =>{ 
        if(mailRef.current!.value == "" ){
            mailRef.current!.focus() ; 
            return ;
        }
        if(passRef.current!.value == ""){
            passRef.current!.focus() ; 
            return ;
        }
        
        const response = await axios.post(`${EXPRESS_SERVER_URL}/api/v1/signin`,{
            password : passRef.current!.value ,
            email    : mailRef.current!.value
        },{ validateStatus : (status) =>  true })

        if(response.status != 200){
          messageRef.current!.innerHTML = response.data.message,3000
          setTimeout(()=> messageRef.current!.innerHTML = "",3000) 
        }
        else {
            const username : string = response.data.username ; 
            const u = username.split(" ") ;
            localStorage.setItem("token",response.data.token) ;
            localStorage.setItem("shortname",`${u[0][0]}${u[1] ? u[1][0] : ""}`) ;
            router.push("/canvas")
        }
    }

    const SignUp = async() =>{
        if(mode == false && userRef.current!.value == ""){
            userRef.current!.focus() ; 
            return ;
        }   
        if(mailRef.current!.value == "" ){
            mailRef.current!.focus() ; 
            return ;
        }
        if(passRef.current!.value == ""){
            passRef.current!.focus() ; 
            return ;
        }
        
        const response = await axios.post(`${EXPRESS_SERVER_URL}/api/v1/signup`,{
            username : userRef.current!.value ,
            password : passRef.current!.value ,
            email    : mailRef.current!.value
        },{ validateStatus : (status) =>  true })

        if(response.status != 200){
          messageRef.current!.innerHTML = response.data.message,3000
          setTimeout(()=> messageRef.current!.innerHTML = "",3000) 
        }else router.push("/auth/signin")
    }

    const handleGoogleSignIn = () => {
        console.log("Sign in with Google");
    };
 
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black pl-1">
            <div className="w-full max-w-full flex flex-col sm:flex-row rounded-[32px] overflow-hidden border-[3px] border-white shadow-2xl">
                {/* Left Panel */}
                <div className="relative rounded-[32px] w-full lg:w-1/2 min-h-[400px] lg:min-h-[700px] flex flex-col justify-between p-8 lg:p-12 lg:pb-6 overflow-hidden">
                    <Image
                        src={gradientBg}
                        alt="Gradient Background"
                        fill
                        className="absolute inset-0 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                    
                    <div className="relative z-10 text-white">
                        <p className="text-[11px] tracking-[0.25em] uppercase font-semibold opacity-80">
                            A WISE QUOTE
                        </p>
                    </div>
                    
                    <div className="relative z-10 text-white max-w-md hidden lg:block">
                        <h1 className="text-xl font-serif mb-2 leading-[1.1]">
                            Get <br/>Everything You Want
                        </h1>
                        <p className="text-[15px] opacity-90 leading-relaxed">
                            You can get everything you want if you work hard,<br />
                            trust the process, and stick to the plan.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-12">
                    <div className="w-full max-w-md">
                        <div className="w-full max-w-md text-center">
                            <div className="flex justify-center mb-12">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                        <div className="w-3 h-3 bg-white rounded-full" />
                                    </div>
                                    <span className="text-lg font-medium text-black">SketchTogether</span>
                                </div>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-serif mb-2 text-black">
                                {mode ? "Welcome Back" : "Create Account"}
                            </h2>
                            <p className="text-sm text-gray-600 mb-8">
                                {mode
                                    ? "Enter your email and password to access your account"
                                    : "Sign up to start sketching your ideas."}
                            </p>
                        </div>

                        <div className="space-y-5 mb-6">
                            {/* Username*/}
                            {!mode && (
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Username
                                    </label>
                                    <Input
                                        ref={userRef}
                                        inputVaraint="TextBox"
                                        size="md"
                                        placeholder="Choose your username"
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Email
                                </label>
                                <Input
                                    ref={mailRef}
                                    inputVaraint="TextBox"
                                    size="md"
                                    placeholder="Enter your email"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        ref={passRef}
                                        inputVaraint="Password"
                                        size="md"
                                        placeholder="Enter your password"
                                        showText={showPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <div
                            ref={messageRef}
                            className="text-sm text-red-600 mb-4 min-h-[20px]"
                        />

                        {/* Sign In/Up Button */}
                        <div className="mb-4">
                            <Button
                                varaint="secondary"
                                size="lg"
                                text={mode ? "Sign In" : "Sign Up"}
                                // customStyle="hover:bg-gray-400"
                                onClick={mode ? SignIn : SignUp}
                            />
                        </div>

                        {/* Sign In with Google */}
                        {mode && (
                            <Button
                                varaint="none"
                                size="lg"
                                text="Sign In with Google"
                                onClick={handleGoogleSignIn}
                                customStyle="border border-gray-300 bg-white text-black hover:bg-gray-50"
                                startIcon={() => (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                )}
                            />
                        )}

                        <p className="text-center text-sm text-gray-700 mt-6">
                            {mode ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => router.push(mode ? "/auth/signup" : "/auth/signin")}
                                className="text-black font-semibold hover:underline"
                            >
                                {mode ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}