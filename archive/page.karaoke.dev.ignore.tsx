'use client';

import { useState, useRef, useEffect } from 'react';
import { Client } from '@web3-storage/w3up-client';

const uploader = createUploader();
const SPACE_DID = 'did:key:z6MkhabowL5MbUsvph6TB5ca8A6SGjPcPXNyxYJZAfUYJdoW';

async function uploadToIPFS(blob) {
  const file = new File([blob], 'frocbox-recording.webm', { type: 'audio/webm' });
  const result = await uploader.uploadFile(file, { space: SPACE_DID });
  return `https://w3s.link/ipfs/${result.cid}`;
}

const tracks = [
  {
    title: 'You Got a Fren in Me',
    audio: '/tracks/you-got-a-fren.mp3',
    lyrics: [
      { time: 0, line: "You've got a fren in me..." },
      { time: 4, line: "You've got a fren in me." },
      { time: 8, line: "When your ledger's fried, and your soul's inside" },
      { time: 12, line: "A memecoin with a roadmap that already died..." },
      { time: 16, line: "You just ping me onchain —" },
      { time: 18, line: "I'll reply 'Still bullish, G.'" },
      { time: 21, line: "You've got a fren in me." },
      { time: 27, line: "You've got a fren, oh yes..." },
      { time: 30, line: "Even when you longed that top with 20 X leverage." },
      { time: 34, line: "When your girlfriend's gone," },
      { time: 36, line: "And your friends don't call," },
      { time: 38, line: "But your bags still post 'due to moon today'..." },
      { time: 42, line: "I'll be right there, next to you my bro..." },
      { time: 46, line: "You've got a fren in me." },
      { time: 52, line: "Other chains may have tech, and clean UX..." },
      { time: 56, line: "But we got lore, and emotional wrecks." },
      { time: 60, line: "We've got tears of fears and screams of pain—" },
      { time: 64, line: "We max green tips but dream of catching dips" },
      { time: 68, line: "So if you're shaking in your weekly bleed..." },
      { time: 72, line: "You've got a fren in me." },
      { time: 78, line: "I once sold low... then I bought in high." },
      { time: 82, line: "Then I staked my soul on a meme you said to buy." },
      { time: 86, line: "They said 'community,' then turned off replies..." },
      { time: 90, line: "Now I scream let's fly at the open sky!" },
      { time: 94, line: "But you sent me charts with a hopeful vibe..." },
      { time: 98, line: "And said 'Bro, just click approve and try...'" },
      { time: 104, line: "You've got a fren in me!" },
      { time: 106, line: "(We're all gonna make it... probably...)" },
      { time: 110, line: "You've got a fren in Base!" },
      { time: 112, line: "(Where the rugs feel safe!)" },
      { time: 116, line: "When the floorboards crack and the dev's gone dark," },
      { time: 120, line: "We still mint vibes like it's a form of art." },
      { time: 124, line: "Don't bridge alone — just call and have a moan!" },
      { time: 128, line: "You've got a fren in me." },
      { time: 134, line: "If you miss that dip, then chase that wick —" },
      { time: 138, line: "We'll both get smacked, but man it's quick!" },
      { time: 142, line: "We don't have plans, we just refresh scans..." },
      { time: 146, line: "And trust the frog with no real hands!" },
      { time: 152, line: "You've got a fren in me!" },
      { time: 154, line: "(Chads unite!)" },
      { time: 158, line: "You've got a fren in Base!" },
      { time: 160, line: "(Low fees, high flight!)" },
      { time: 164, line: "When the candles bleed and your chart draws tears —" },
      { time: 168, line: "We'll stake our rent for another ten years." },
      { time: 172, line: "So don't yolo it solo — we're wrecked but loco..." },
      { time: 176, line: "You've got a fren..." },
      { time: 179, line: "You've got a fren..." },
      { time: 182, line: "You've got a fren in me." },
    ],
  },
];


export default function KaraokePage() {
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioStream = audioRef.current?.captureStream();
      if (!audioStream) throw new Error('Audio tag stream failed');

      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();

      const micSource = context.createMediaStreamSource(micStream);
      const audioSource = context.createMediaStreamSource(audioStream);

      micSource.connect(destination);
      audioSource.connect(destination);

      const combinedStream = destination.stream;
      const mediaRecorder = new MediaRecorder(combinedStream);

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        uploadToIPFS(blob).then((url) => {
          setRecordedAudio(url);
          console.log('Uploaded to IPFS:', url);
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Mic or audio stream error:', err);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-4 text-center">Froc Karaoke</h1>
      <p className="text-center mb-8">Sing your heart out. Mint your shame.</p>

      <div className="max-w-xl mx-auto bg-white text-black p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-2">{currentTrack.title}</h2>

        <audio ref={audioRef} src={currentTrack.audio} className="w-full mb-4" controls />

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Play Track
          </button>

          <button
            onClick={handleRecord}
            className={`${
              isRecording ? 'bg-red-600' : 'bg-green-600'
            } text-white px-4 py-2 rounded hover:opacity-90`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        {isRecording && (
          <p className="text-red-600 font-bold mb-4">Recording... 🎤</p>
        )}

        <div className="mt-6 h-40 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded">
          {currentTrack.lyrics.map((line, index) => (
            <p
              key={index}
              className={
                currentTime >= line.time && currentTime < line.time + 4
                  ? 'font-bold text-white'
                  : 'text-sm opacity-60'
              }
            >
              {line.line}
            </p>
          ))}
        </div>

        {recordedAudio && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Your Recording Preview</h3>
            <audio src={recordedAudio} controls className="w-full" />
          </div>
        )}
      </div>
    </main>
  );
}
