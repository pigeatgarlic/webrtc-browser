import { setDebug } from "./log";

enum EventCode{
    MouseWheel,
    MouseMove,
    MouseUp,
    MouseDown,

    KeyUp,
    KeyDown,
    KeyPress,
    KeyReset,
}

class HIDMsg {
    code: EventCode
    data: Map<string,string>
    constructor(code: EventCode, data: any)
    {
        this.code = code;
        this.data = new Map<string,string>();
        Object.keys(data).forEach(function(key) {
            this.data.set(key,data[key]);
        });
    }
}

enum ShortcutCode{
    Fullscreen,
}
enum KeyCode{
    Shift = 0,
    Alt,
    Ctrl,

    F = "KeyF",
    P = "KeyP",
}

class Shortcut {
    code : ShortcutCode
    keys : Array<KeyCode>
    Handler: ((a: void) => (void))


    constructor(code: ShortcutCode,
                keys : Array<KeyCode>,
                Handler: ((a: void) => (void))){
        this.code = code;
        this.keys = keys;
        this.Handler = Handler;
    }

    public HandleShortcut(event : KeyboardEvent){
        var shift = this.keys.includes(KeyCode.Shift) === event.shiftKey;
        var alt   = this.keys.includes(KeyCode.Alt)   === event.altKey;
        var ctrl  = this.keys.includes(KeyCode.Ctrl)  === event.ctrlKey;

        var key = false;
        this.keys.forEach(element => {
            if(element === event.code) {
                key = true; 
            }
        });

        if (shift && alt && ctrl && key) {
            event.preventDefault();
            setDebug(`shortcut fired with code ${this.code}`)
            this.Handler();
        }
    }
}


export class HID {
    private shortcuts: Array<Shortcut>
    private relativeMouse: boolean
    private Screen: {
        /*
        * frame resolution used to transport to client
        */
        StreamWidth: number,
        StreamHeight: number,


        /*
        * client resolution display on client screen
        */
        ClientWidth: number,
        ClientHeight: number,
        /*
        * client resolution display on client screen
        */
        ClientTop: number,
        ClientLeft: number,
    }

    private hovering: boolean
    private video: any 
    private SendFunc: ((data: string) => (void))
    constructor(videoElement: any, Sendfunc: ((data:string)=>(void))){
        this.video = videoElement;
        this.SendFunc = Sendfunc;
        this.Screen = {
            StreamHeight: 0,
            StreamWidth: 0,
            ClientHeight: 0,
            ClientWidth: 0,
            ClientLeft: 0,
            ClientTop: 0,
        }


        var VideoElement : HTMLVideoElement;
        VideoElement = this.video.current;
        /**
         * video event
         */
        VideoElement.addEventListener('contextmenu',   ((event: Event) => {event.preventDefault()})); ///disable content menu key on remote control

        /**
         * mouse event
         */
        VideoElement.addEventListener('wheel',          this.mouseWheel.bind(this));
        VideoElement.addEventListener('mousemove',      this.mouseButtonMovement.bind(this));
        VideoElement.addEventListener('mousedown',      this.mouseButtonDown.bind(this));
        VideoElement.addEventListener('mouseup',        this.mouseButtonUp.bind(this));
        
        /**
         * keyboard event
         */
        window.addEventListener('keydown',        this.keydown.bind(this));
        window.addEventListener('keyup',          this.keyup.bind(this));

        /**
         * mouse lock event
         */
        VideoElement.addEventListener('mouseleave',     this.mouseLeaveEvent.bind(this));
        VideoElement.addEventListener('mouseenter',     this.mouseEnterEvent.bind(this));

        document.addEventListener('pointerlockchange',  this.pointerLock.bind(this));



        this.shortcuts = new Array<Shortcut>();
        this.shortcuts.push(new Shortcut(ShortcutCode.Fullscreen,[KeyCode.Ctrl,KeyCode.F],(()=> {})))
    }

    mouseEnterEvent(event: MouseEvent) {
        setDebug("mouse enter")
    }
    mouseLeaveEvent(event: MouseEvent) {
        setDebug("mouse leave")
    }
    pointerLock(event: Event) {

    }
    keydown(event: KeyboardEvent) {
        this.shortcuts.forEach((element: Shortcut) => {
            element.HandleShortcut(event);
        })
        let jsKey = event.code;
        let code = EventCode.KeyDown
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            key: jsKey,
        })));
    }
    keyup(event: KeyboardEvent) {
        let jsKey = event.code;
        let code = EventCode.KeyUp;
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            key: jsKey,
        })));
    }
    mouseWheel(event: WheelEvent){
        let wheelY = event.deltaY;
        let wheelX = event.deltaX;
        let code = EventCode.MouseWheel
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            deltaY: wheelY,
        })));
    }
    mouseButtonMovement(event: MouseEvent){
        this.elementConfig(this.video.current)
        let mousePosition_X = this.clientToServerX(event.clientX);
        let mousePosition_Y = this.clientToServerY(event.clientY);
        let code = EventCode.MouseMove
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            dX: mousePosition_X,
            dY: mousePosition_Y,
        })));
    }
    mouseButtonDown(event: MouseEvent){
        let code = EventCode.MouseDown
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            button: event.button
        })));
    }
    mouseButtonUp(event: MouseEvent){
        let code = EventCode.MouseUp
        this.SendFunc(JSON.stringify(new HIDMsg(code,{
            button: event.button
        })));
    }



    clientToServerY(clientY: number): number
    {
        return (clientY - this.Screen.ClientTop) / this.Screen.ClientHeight;
    }

    clientToServerX(clientX: number): number 
    {
        return (clientX - this.Screen.ClientLeft) / this.Screen.ClientWidth;
    }

    elementConfig(VideoElement: HTMLVideoElement) 
    {
        /**
         * size of video element (included its border) on client screen
         * (displayed video size)
         */
        this.Screen.ClientWidth  =  VideoElement.offsetWidth;
        this.Screen.ClientHeight = VideoElement.offsetHeight;
        this.Screen.ClientTop    =  VideoElement.offsetTop;
        this.Screen.ClientLeft   = VideoElement.offsetLeft;
        this.Screen.StreamHeight =  VideoElement.videoHeight;
        this.Screen.StreamWidth  = VideoElement.videoWidth;

        // setDebug(
        // `stream Width: ${VideoElement.videoWidth} \n`+
        // `stream Height: ${VideoElement.videoHeight} \n`+
        // `offset Width: ${VideoElement.offsetWidth} \n`+
        // `offset Height: ${VideoElement.offsetHeight} \n`+
        // `offset Left: ${VideoElement.offsetLeft} \n`+
        // `offset Top: ${VideoElement.offsetTop} \n`);
    }
}