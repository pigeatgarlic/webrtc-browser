import React, { useEffect, useRef, } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { OneplayApp } from '../webrtc/app'


const Home = ({signaling_url} : {signaling_url: string}) => {
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  useEffect(() => { 
    if (remoteVideo.current) {

      console.log("Started oneplay app")
      var app = new OneplayApp(remoteVideo,remoteAudio,"client",() => {
        console.log("websocket connection failed, please retry")
        // location.reload();
      });
    }
  }, [])

  return (
    <div className={styles.app}>
      <Head>
        <title>WebRTC remote viewer</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <video
        ref={remoteVideo}
        className={styles.remoteVideo}
        autoPlay
        muted
        playsInline
        loop
      ></video>
      <audio 
        ref={remoteAudio} 
        autoPlay
        controls
      ></audio>
    </div>
  )
}

// export async function getStaticProps() {
//   // console.log(`env: ${process.env.SIGNALING_SERVER}`)
// }

export default Home
