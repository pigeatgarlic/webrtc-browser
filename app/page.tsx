"use client"

import React, { useEffect, useRef, useState } from "react";
import video_desktop from "../public/assets/videos/video_demo_desktop.mp4";
import styled from "styled-components";
import {
    TurnOnConfirm,
    TurnOnStatus,
} from "../components/popup/popup";
import { WebRTCClient } from "../core/src/app";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AddNotifier,
    ConnectionEvent,
    LogConnectionEvent,
} from "../core/src/utils/log";
import { WebRTCControl } from "../components/control/control";
import {
	getPlatform,
	Platform,
} from "../core/src/utils/platform";
import SbCore from "../supabase";
import { Modal } from "@mui/material";
import { IconHorizontalPhone } from "../public/assets/svg/svg_cpn";

let client : WebRTCClient = null

export default function Home () {
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const remoteAudio = useRef<HTMLAudioElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter()

    let ref_local        = ''
    if (typeof window !== 'undefined') {
        ref_local        = localStorage.getItem("reference")
    }
    const user_ref   = searchParams.get('uref') ?? undefined
    const ref        = searchParams.get('ref')  ?? ref_local 
    const platform   = searchParams.get('platform'); 

    const [Platform,setPlatform] = useState<Platform>(null);

    const SetupConnection = async () => {
        localStorage.setItem("reference",ref)
        
        const core = new SbCore()
        if (!await core.Authenticated() && user_ref == undefined) 
			await core.LoginWithGoogle()
        
        if(ref == null) 
            return

        const result = await core.AuthenticateSession(ref,user_ref)
        if (result instanceof Error) 
            return

        const {token,email,SignalingURL,WebRTCConfig,PingCallback} = result
        setInterval(PingCallback,14000)

        await LogConnectionEvent(ConnectionEvent.ApplicationStarted)
        client = new WebRTCClient(
            SignalingURL,token, WebRTCConfig,
            remoteVideo.current, 
            remoteAudio.current,  
            Platform)
    }

    
	const [isModalOpen, setModalOpen] = useState(false)
	const checkHorizontal = (width: number,height:number) => {
        setModalOpen(width < height)
	}

    useEffect(() => {
        AddNotifier(async (message: ConnectionEvent, text?: string) => {
            if(message == ConnectionEvent.WebSocketConnected || 
                message == ConnectionEvent.ExchangingSignalingMessage || 
                message == ConnectionEvent.WaitingAvailableDeviceSelection)  {
                return;
            }

            if (message == ConnectionEvent.ApplicationStarted ||
                message == ConnectionEvent.ReceivedVideoStream ||
                message == ConnectionEvent.ReceivedAudioStream ) {
                await TurnOnConfirm(message,text)
                return
            }
            
            TurnOnStatus(message,text);

            if(message == ConnectionEvent.WebRTCConnectionClosed) 
                router.refresh();
        })

        SetupConnection().catch(error => {
            TurnOnStatus(error);
        })

        setPlatform(old => { if (old == null) return getPlatform() })

        if(getPlatform() != 'mobile')
            return
        
		checkHorizontal(window.innerWidth,window.innerHeight)
        window.addEventListener('resize', (e: UIEvent) => {
			checkHorizontal(window.innerWidth, window.innerHeight)
		})

		return () => { 
            window.removeEventListener('resize', (e: UIEvent) => { 
                checkHorizontal(window.innerWidth, window.innerHeight)
			})
		}
    }, []);


    const toggle_mouse_touch_callback=async function(enable: boolean) { 
        client?.hid?.DisableTouch(!enable);
        client?.hid?.DisableMouse(!enable);
    } 
    const bitrate_callback= async function (bitrate: number) { 
        client?.ChangeBitrate(bitrate);
        client?.ChangeFramerate(55);
    } 
    const GamepadACallback=async function(x: number, y: number, type: "left" | "right"): Promise<void> {
        client?.hid?.VirtualGamepadAxis(x,y,type);
    } 
    const GamepadBCallback=async function(index: number, type: "up" | "down"): Promise<void> {
        client?.hid?.VirtualGamepadButtonSlider(type == 'down',index);
    }  
    const MouseMoveCallback=async function (x: number, y: number): Promise<void> {
        client?.hid?.mouseMoveRel({movementX:x,movementY:y});
    } 
    const MouseButtonCallback=async function (index: number, type: "up" | "down"): Promise<void> {
        type == 'down' ? client?.hid?.MouseButtonDown({button: index}) : client?.hid?.MouseButtonUp({button: index})
    } 
    const keystuckCallback= async function (): Promise<void> {
        client?.hid?.ResetKeyStuck();
    }
    const clipboardSetCallback= async function (val: string): Promise<void> {
        console.log(val)
        client?.hid?.SetClipboard(val)
        client?.hid?.PasteClipboard()
    }
    const audioCallback = async() => {
        try { 
            client?.ResetAudio()
            await remoteAudio.current.play() 
            await remoteVideo.current.play() 
        } catch (e) {
            console.log(`error play audio ${JSON.stringify(e)}`)
        }
    }
    return (
        <Body>
            <RemoteVideo
                ref={remoteVideo}
                src={platform == 'desktop' ? video_desktop : video_desktop}
                autoPlay
                muted
                playsInline
                loop
            ></RemoteVideo>
            <App
                onContextMenu={(e) => {
                    e.preventDefault()
                }}
                onMouseUp={(e: MouseEvent) => {
                    e.preventDefault();
                }}
                onMouseDown={(e: MouseEvent) => {
                    e.preventDefault();
                }}
                onKeyUp={(e: KeyboardEvent) => {
                    e.preventDefault();
                }}
                onKeyDown={(e: KeyboardEvent) => {
                    e.preventDefault();
                }}
            >
                <WebRTCControl platform={Platform} 
                toggle_mouse_touch_callback={toggle_mouse_touch_callback}
                bitrate_callback={bitrate_callback}
                GamepadACallback={GamepadACallback}
                GamepadBCallback={GamepadBCallback}
                MouseMoveCallback={MouseMoveCallback}
                MouseButtonCallback={MouseButtonCallback}
                keystuckCallback={keystuckCallback}
                audioCallback={audioCallback}
                clipboardSetCallback={clipboardSetCallback}
                ></WebRTCControl>
            </App>
            <audio
                ref={remoteAudio}
                autoPlay={true}
                playsInline={true}
                controls={false}
                muted={false}
                loop={true}
                style={{ zIndex: -5, opacity: 0 }}
            ></audio>
			<Modal
				open={isModalOpen}
				onClose={() => setModalOpen(false)}
			>
				<ContentModal
				>
					<IconHorizontalPhone />
					<TextModal>Please rotate the phone horizontally!!</TextModal>
				</ContentModal>
			</Modal>
        </Body>
    );
};

const RemoteVideo = styled.video`
    position: absolute;
    z-index: 1;
    -webkit-transform-style: preserve-3d;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    margin: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
    opacity: 1;
`;
const Body = styled.div`
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    border: 0;
    overflow: hidden;
    background-color: black;
`;
const App = styled.div`
    touch-action: none;
    position: relative;
    width: 100vw;
    height: 100vh;
`;
const ContentModal = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	
`
const TextModal = styled.p`
	font-weight: 500;
	color: white;
`
//export default Home;?
