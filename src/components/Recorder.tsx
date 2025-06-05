'use client';

import { useState, useRef, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Client } from '@web3-storage/w3up-client';
import { useAddress, useMetamask } from '@thirdweb-dev/react';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';

const ffmpeg = createFFmpeg({ log: true });
const CONTRACT_ADDRESS = "0xdf8834A774d08Af6e2591576F075efbb459FEAF3";
const SPACE_DID = process.env.SPACE_DID!;

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [ipfsCID, setIpfsCID] = useState<string | null>(null);
  const [mintedURL, setMintedURL] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const connect = useMetamask();
  const walletAddress = useAddress();

  useEffect(() => {
    if (!walletAddress) connect();
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
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      const finalVideo = await runFFmpeg(blob);
      uploadToIPFS(finalVideo);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const runFFmpeg = async (audioBlob: Blob) => {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

const audioData = await audioBlob.arrayBuffer();
const videoResponse = await fetch('https://w3s.link/ipfs/bafybeieda4yxt2uzgwirc6e56q4zscvhy4ry4nlg252p3d7jl4s7br2mmq/You%20got%20a%20fren%20(NO%20SOUND).mp4');
const videoData = await videoResponse.arrayBuffer();

ffmpeg.FS('writeFile', 'audio.webm', audioData);
ffmpeg.FS('writeFile', 'video.mp4', videoData);

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
    return new Blob([data.buffer], { type: 'video/mp4' });
  };

  const uploadToIPFS = async (blob: Blob) => {
    const client = new Client();
    await client.login('craig@imoon.ai');
    await client.setCurrentSpace(SPACE_DID);
    const file = new File([blob], 'frocbox-final.mp4', { type: 'video/mp4' });
    const cid = await client.uploadFile(file);
    setIpfsCID(cid.toString());
    console.log("✅ Uploaded to IPFS:", cid);
  };

  const handleMint = async () => {
    if (!ipfsCID || !walletAddress) return;
    setMinting(true);
    const sdk = new ThirdwebSDK("base");
    const contract = await sdk.getContract(CONTRACT_ADDRESS);
    const metadata = {
      name: "Base Idol Performance",
      description: "A performance from the BASE IDOL stage.",
      image: `ipfs://${ipfsCID}`,
    };
    const tx = await contract.erc721.mintTo(walletAddress, metadata);
    const tokenId = tx.id.toString();
    const url = `https://thirdweb.com/base/${CONTRACT_ADDRESS}/tokens/${tokenId}`;
    setMintedURL(url);
    setMinting(false);
  };

  return (
    <div className="p-6 bg-black text-white text-center">
      <h2 className="text-xl font-bold mb-4">🎤 Record Your Base Idol Track</h2>
      {!recording && (
        <button onClick={startRecording} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-semibold">
          Start Recording
        </button>
      )}
      {recording && (
        <button onClick={stopRecording} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white font-semibold">
          Stop Recording
        </button>
      )}
      {audioURL && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">🔊 Preview:</h3>
          <audio controls className="mt-2 w-full">
            <source src={audioURL} type="audio/webm" />
          </audio>
        </div>
      )}
      {ipfsCID && (
        <div className="mt-6 text-green-400 text-sm">
          ✅ Uploaded to IPFS:
          <a href={`https://w3s.link/ipfs/${ipfsCID}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">View</a>
          <div className="mt-4">
            <button onClick={handleMint} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-semibold">
              {minting ? "Minting..." : "Mint This Track"}
            </button>
          </div>
          {mintedURL && (
            <div className="mt-4 text-blue-400">
              🪙 Minted! <a href={mintedURL} target="_blank" rel="noopener noreferrer" className="underline">View NFT</a>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <a href="https://create.zora.co/" target="_blank" rel="noopener noreferrer" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">
              🚀 Make this a Coin on Zora
            </a>
            <a href={`https://twitter.com/intent/tweet?text=I+just+minted+my+Base+Idol+track+on+FrocBox!+%F0%9F%8E%A4+%23BaseIdol+%23OnBase+${encodeURIComponent(mintedURL || "")}`} target="_blank" rel="noopener noreferrer" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-semibold">
              🧵 Enter Base Idol (Share on X)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
