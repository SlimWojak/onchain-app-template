'use client';

import { useState, useRef, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { useAddress, useConnect, metamaskWallet, walletConnect } from '@thirdweb-dev/react';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import confetti from 'canvas-confetti';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';

const ffmpeg = createFFmpeg({ log: true });
const CONTRACT_ADDRESS = '0xdf8834A774d08Af6e2591576F075efbb459FEAF3';
const WEB3_TOKEN = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN!;

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [minting, setMinting] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [mintedURL, setMintedURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const connect = useConnect();
  const walletAddress = useAddress();

  useEffect(() => {
    if (!walletAddress) connect(walletConnect());
  }, [walletAddress]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const finalVideo = await runFFmpeg(audioBlob);
      const url = await uploadToIPFS(finalVideo);
      setVideoURL(url);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const runFFmpeg = async (audioBlob: Blob): Promise<Blob> => {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    ffmpeg.FS('writeFile', 'audio.webm', await fetchFile(audioBlob));
    ffmpeg.FS('writeFile', 'video.mp4', await fetchFile('https://w3s.link/ipfs/bafybeieda4yxt2uzgwirc6e56q4zscvhy4ry4nlg252p3d7jl4s7br2mmq/You%20got%20a%20fren%20(NO%20SOUND).mp4'));

    await ffmpeg.run(
      '-i', 'video.mp4',
      '-i', 'audio.webm',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const buffer = data.buffer instanceof ArrayBuffer ? data.buffer : new Uint8Array(data.buffer).buffer;
    return new Blob([buffer], { type: 'video/mp4' });
  };

  const uploadToIPFS = async (blob: Blob): Promise<string> => {
    if (!WEB3_TOKEN) throw new Error('Missing token in .env.local');

    const file = new File([blob], 'output.mp4', { type: 'video/mp4' });
    console.log('📤 Uploading to Web3.Storage...');
    const res = await fetch('https://api.web3.storage/v2/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WEB3_TOKEN}`,
      },
      body: file,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ Upload failed:', err);
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    const cid = data.cid;
    console.log(`✅ Uploaded with CID: ${cid}`);
    return `https://w3s.link/ipfs/${cid}`;
  };

  const handleMint = async () => {
    if (!videoURL || !walletAddress) return;
    setMinting(true);
    try {
      const sdk = new ThirdwebSDK('base');
      const contract = await sdk.getContract(CONTRACT_ADDRESS);
      const tx = await contract.erc721.mintTo(walletAddress, {
        name: 'Froc Superstar Track',
        description: 'Minted from the FrocBox',
        image: videoURL,
      });
      console.log('✅ Minted NFT:', tx);
      setMintedURL(`https://basescan.org/token/${CONTRACT_ADDRESS}?a=${tx.id}`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('❌ Mint error:', err);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="p-6 bg-black text-white text-center">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-fuchsia-400">🎤 BASE IDOL</h1>
        <p className="text-gray-300 text-sm">Submit your track. Impress the frog. Become legendary.</p>
      </div>

      {!walletAddress && (
        <div className="space-x-4 my-4">
          <button onClick={() => connect(metamaskWallet())} className="bg-purple-600 px-4 py-2 rounded text-white">
            Connect MetaMask
          </button>
          <button onClick={() => connect(walletConnect())} className="bg-blue-600 px-4 py-2 rounded text-white">
            WalletConnect
          </button>
        </div>
      )}

      {!recording ? (
        <button
          onClick={startRecording}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-semibold"
          title="Start recording your voice over the music video"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white font-semibold"
          title="Stop and generate your video"
        >
          Stop Recording
        </button>
      )}

      {videoURL && (
        <>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold">🎬 Final Video Preview:</h3>
            <video controls className="mt-2 w-full rounded-lg shadow-md" poster="/animation/fren.png">
              <source src={videoURL} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              id="mint-btn"
              data-tooltip-id="mint-tip"
              data-tooltip-content="Mint this clip as a 1:1 NFT and enter the Base Idol competition"
              onClick={handleMint}
              disabled={minting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              {minting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {minting ? 'Submitting...' : '🎟️ Enter Base Idol'}
            </button>

            <a
              href={videoURL}
              download="froc-superstar.mp4"
              className="text-white underline hover:text-green-400"
              title="Download your video file to keep or share"
            >
              💾 Save Your Clip
            </a>

            <a
              href={`https://zora.co/create?media=${encodeURIComponent(videoURL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline hover:text-blue-500"
              title="Open Zora and mint your clip as a standalone music release"
            >
              🚀 Launch on Zora
            </a>
          </div>

          {mintedURL && (
            <div className="mt-4 text-blue-300 text-sm">
              ✅ Minted:
              <a href={mintedURL} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                View on BaseScan
              </a>
            </div>
          )}
        </>
      )}

      <Tooltip id="mint-tip" place="top" />

      <footer className="mt-10 text-xs text-gray-500 text-center">
        Slim Wojak is watching 👀 — mint now to be judged.
      </footer>
    </div>
  );
}
