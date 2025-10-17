class Queue{
    queue : Array<any> ;
    constructor(){
        this.queue = [] ;
    }

    push = (ele : any) : void =>{  
        this.queue.push(ele) ; 
    }

    front = () : any => this.queue[0] ;
    pop = () : any  => this.queue.shift() ;
    length = () : number => this.queue.length ;
}

export { Queue } ;