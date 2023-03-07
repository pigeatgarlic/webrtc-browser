import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styled from "styled-components";
import {
    AskSelectBitrate,
    AskSelectDisplay,
    AskSelectFramerate,
    AskSelectSoundcard,
    TurnOnAlert,
    TurnOnStatus,
} from "../components/popup/popup";
import { WebRTCClient } from "webrtc-streaming-core/dist/app";
import { useRouter } from "next/router";
import {
    DeviceSelection,
    DeviceSelectionResult,
} from "webrtc-streaming-core/dist/models/devices.model";
import {
    ConnectionEvent,
    EventMessage,
    Log,
    LogConnectionEvent,
    LogLevel,
} from "webrtc-streaming-core/dist/utils/log";
import { GetServerSideProps } from "next";
import { GoogleAnalytics } from "nextjs-google-analytics";
import Button from "@mui/material/Button";
import { WebRTCControl } from "../components/control/control";
import { VirtualGamepad } from "../components/control/virtGamepad/virtGamepad";
import { getPlatform, Platform } from "webrtc-streaming-core/dist/utils/platform";
import { Analytics } from '@vercel/analytics/react';


type Props = { host: string | null };
export const getServerSideProps: GetServerSideProps<Props> = async (
    context
) => ({ props: { host: context.req.headers.host || null } });


const Home = ({ host }) => {
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const remoteAudio = useRef<HTMLAudioElement>(null);

    const router = useRouter();
    const { signaling, token, fps, bitrate,platform } = router.query;
    const signalingURL = Buffer.from(
        (signaling
            ? signaling
            : "d3NzOi8vc2VydmljZS50aGlua21heS5uZXQvaGFuZHNoYWtl") as string,
        "base64"
    ).toString();
    const signalingToken = (token ? token : "none") as string;
    var defaultBitrate = parseInt((bitrate ? bitrate : "6000") as string, 10);
    var defaultFramerate = parseInt((fps ? fps : "55") as string, 10);
    var defaultSoundcard = "Default Audio Render Device";
    var defaultPlatform: Platform = platform == 'mobile' ? 'mobile' : (platform == 'desktop' ? 'desktop' : null);
    const selectDevice = async (offer: DeviceSelection) => {
        LogConnectionEvent( ConnectionEvent.WaitingAvailableDeviceSelection);
        let ret = new DeviceSelectionResult(
            offer.soundcards[0].DeviceID,
            offer.monitors[0].MonitorHandle.toString()
        );

        if (offer.soundcards.length > 1) {
            let exist = false;
            if (defaultSoundcard != null) {
                offer.soundcards.forEach((x) => {
                    if (x.Name == defaultSoundcard) {
                        exist = true;
                        ret.SoundcardDeviceID = x.DeviceID;
                        defaultSoundcard = null;
                    }
                });
            }

            if (!exist) {
                ret.SoundcardDeviceID =
                    await AskSelectSoundcard(
                        offer.soundcards
                    );
                Log(
                    LogLevel.Infor,
                    `selected audio deviceid ${ret.SoundcardDeviceID}`
                );
            }
        }

        if (offer.monitors.length > 1) {
            ret.MonitorHandle = await AskSelectDisplay(
                offer.monitors
            );
            Log(
                LogLevel.Infor,
                `selected monitor handle ${ret.MonitorHandle}`
            );
        }

        if (defaultBitrate == null) {
            ret.bitrate = await AskSelectBitrate();
        } else {
            ret.bitrate = defaultBitrate;
        }
        if (defaultFramerate == null) {
            ret.framerate = await AskSelectFramerate();
        } else {
            ret.framerate = defaultFramerate;
        }

        return ret;
    }

    const [Platform,setPlatform] = useState<Platform>(null);
    const [client,setclient] = useState<WebRTCClient>(null); //always useState for WebRTCClient, trust me
    useEffect(() => {
        let newplatform = defaultPlatform;
        if (defaultPlatform == null) {
            newplatform = getPlatform()
        }
        setPlatform(newplatform)
        setclient(new WebRTCClient( signalingURL, remoteVideo.current, remoteAudio.current, signalingToken, selectDevice, newplatform)
        .Notifier((message: EventMessage) => {
            console.log(message);
            TurnOnStatus(message);
            if(message == 'WebRTCConnectionClosed') {
              location.reload();
            }
        }))
    }, []);
        
    const toggle_mouse_touch_callback=async function(enable: boolean) { 
        client?.hid?.disableTouch(!enable);
        // TODO
    } 
    const bitrate_callback=async function (bitrate: number) { 
        client?.ChangeBitrate(bitrate);
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
        client?.hid?.ResetKeyStuck(null);
    }

    return (
        <Body >
            <GoogleAnalytics trackPageViews />
            <Analytics />

            <Head>
                <title>WebRTC remote viewer</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
                ></meta>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <RemoteVideo
                ref={remoteVideo}
                autoPlay
                muted
                playsInline
                loop
            ></RemoteVideo>

            <App 
                onContextMenu= {(e) => e.preventDefault()}
                onMouseUp=   {(e :MouseEvent)    => {e.preventDefault()}}
                onMouseDown= {(e :MouseEvent)    => {e.preventDefault()}}
                onKeyUp=     {(e :KeyboardEvent) => {e.preventDefault()}}
                onKeyDown=   {(e :KeyboardEvent) => {e.preventDefault()}}
            >
                <WebRTCControl platform={Platform} 
                toggle_mouse_touch_callback={toggle_mouse_touch_callback}
                bitrate_callback={bitrate_callback}
                GamepadACallback={GamepadACallback}
                GamepadBCallback={GamepadBCallback}
                MouseMoveCallback={MouseMoveCallback}
                MouseButtonCallback={MouseButtonCallback}
                keystuckCallback={keystuckCallback}
                ></WebRTCControl>
            </App>
            <audio
                ref={remoteAudio}
                autoPlay
                controls
                style={{ zIndex: -5, opacity: 0 }}
            ></audio>
        </Body>
    );
};

const RemoteVideo = styled.video`
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    margin: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
`;
const Body = styled.div`
    width: 100%;
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
export default Home;
