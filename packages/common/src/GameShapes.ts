type Rectangle = {
    type : "Rectangle",
    x : number,
    y : number,
    width: number,
    height: number,
    coords : Coordinate[],
}

type Circle = {
    type : "Circle",
    centerX : number,
    centerY : number,
    radiusX : number,
    radiusY : number
    coords : Coordinate[],
}

type Line = {
    type : "Line",
    startX : number ,
    startY : number ,
    endX   : number ,
    endY   : number ,
    coords : Coordinate[],
}

type Pencil = {
   type : "Pencil",
   coords : Coordinate[],
}

export type Coordinate = { x : number , y : number} ;  
export type Shape = Rectangle | Circle | Line| Pencil 

// Final Shape
// export type Shape = { 
//     type : "Circle" | "Rectangle" | "Line" | "Pencil" | "Text" ,
//     coords : Coordinate[]
// }