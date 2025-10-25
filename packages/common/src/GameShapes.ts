/*
type Rectangle = {
    type : "Rectangle",
    startXY : Coordinate ,
    endXY : Coordinate
    width: number,
    height: number,
    coords : Coordinate[],
}

type Circle = {
    type : "Circle",
    startXY : Coordinate ,
    endXY   : Coordinate
    centerX : number,
    centerY : number,
    radiusX : number,
    radiusY : number
    coords : Coordinate[],
}

type Line = {
    type : "Line",
    startXY : Coordinate ,
    endXY   : Coordinate
    coords : Coordinate[],
}

type Pencil = {
   type : "Pencil",
   startXY : Coordinate ,
   endXY : Coordinate,
   coords : Coordinate[],
}

// export type Shape = Rectangle | Circle | Line| Pencil | Text  // Game1.ts

*/

type Text = {
   type    : "Text",
   text    : string 
   startXY : Coordinate ,
   endXY   : Coordinate
   coords  : Coordinate[],
}

export type Coordinate = { x : number , y : number} ;  

// Final Shape
export type Shape = { 
    type : "Circle" | "Rectangle" | "Line" | "Pencil" ,
    startXY : Coordinate ,
    endXY   : Coordinate
    coords  : Coordinate[]
} | Text