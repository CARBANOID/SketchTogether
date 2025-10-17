export default function Loader({customAlignment} : {customAlignment? : string}){
    return (
        <div className={`${(customAlignment) ? customAlignment : "fixed max-h-screen h-full max-w-screen w-full" } flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black  overflow-hidden`}>
            {/* Background animated blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-slate-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center space-y-8">
                {/* Animated loader spinner */}
                <div className="flex justify-center">
                    <div className="relative w-24 h-24">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-300 border-r-slate-400 animate-spin"></div>
                        
                        {/* Middle ring */}
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-slate-300 border-l-slate-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                        
                        {/* Inner circle */}
                        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 blur-sm opacity-20"></div>
                        
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Text content */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 bg-clip-text text-transparent">
                        Loading...
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Preparing your canvas
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
            </div>

            {/* Bottom text */}
            <div className="absolute bottom-10 text-center">
                <p className="text-slate-600 text-xs">This may take a few moments...</p>
            </div>
        </div>
    )
}