import { useRef } from "react"
import { Circle, Square, Minus, MousePointer,Pencil,TextInitial,HandGrabIcon , Trash2} from "lucide-react"

export type ShapeLabelType = "Circle" | "Rectangle" | "Line" | "Pencil" | "Move" | "Update" | "Text" | "Delete"

type ShapeDetails = {
    label: ShapeLabelType,
    icon : typeof Circle,
    className: string   
}

const shapeOptions : ShapeDetails[] = [
    {
        label: "Move",
        icon :  HandGrabIcon,
        className: "w-5 h-5"      
    },
    {
        label: "Update",
        icon :  MousePointer,
        className: "w-5 h-5"      
    },
    {
        label: "Text",
        icon :  TextInitial,
        className: "w-5 h-5"      
    },
    {
        label: "Circle",
        icon :  Circle,
        className: "w-5 h-5"
    },
    {
        label: "Rectangle",
        icon :  Square,
        className: "w-5 h-5"
    },
    {
        label: "Line",
        icon :  Minus,
        className: "w-5 h-5"
    },
    {
        label: "Pencil",
        icon :  Pencil,
        className: "w-5 h-5"      
    },
    {
        label: "Delete",
        icon :  Trash2,
        className: "w-5 h-5"      
    }
]

export const ShapeSelectBar = ( { ShapeSelected, SelectShape } : { ShapeSelected : ShapeLabelType ,SelectShape: (shape: ShapeLabelType) => void}) => {
    return(
        <div className="fixed flex top-5 left-2/5 items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg p-2">
            {shapeOptions.map((shapeOpt) => <ShapeOption key={shapeOpt.label} ShapeSelected={ShapeSelected} shapeOpt = {shapeOpt} SelectShape={SelectShape}/> )}
        </div>
    )
}

const ShapeOption = ({ShapeSelected , shapeOpt , SelectShape} : {ShapeSelected : ShapeLabelType , shapeOpt : ShapeDetails , SelectShape : (shape: ShapeLabelType) => void}) => {
    const ShapeIconRef = useRef(shapeOpt.icon) ;
    const isActive = (ShapeSelected === shapeOpt.label) ;

    return(
        <button
         onClick={() => SelectShape(shapeOpt.label)}
         title={shapeOpt.label}
         className={`
            p-2 rounded-md transition-all duration-200
            flex items-center justify-center
            ${isActive 
                ? " text-[#7e55cc] shadow-lg shadow-purple-500/20" 
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }
         `}
        >
            <ShapeIconRef.current className={shapeOpt.className} />
        </button>
    )
}

