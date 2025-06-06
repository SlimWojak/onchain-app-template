'use client';

import { useState, useRef, useEffect } from 'react';
import { Client } from '@web3-storage/w3up-client';
import { useAddress, useMetamask } from '@thirdweb-dev/react';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });
const CONTRACT_ADDRESS = '0xdf8834A774d08Af6e2591576F075efbb459FEAF3';
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
      await uploadToIPFS(finalVideo);
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

    ffmpeg.FS('writeFile', 'audio.webm', await fetchFile(audioBlob));
    ffmpeg.FS(
      'writeFile',
      'video.mp4',
      await fetchFile('https://w3s.link/ipfs/bafybeieda4yxt2uzgwirc6e56q4zscvhy4ry4nlg252p3d7jl4s7br2mmq/You%20got%20a%20fren%20(NO%20SOUND).mp4')
    );

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
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (!token) throw new Error('Missing WEB3_STORAGE token in .env');

  const file = new File([blob], 'output.mp4', { type: 'video/mp4' });
  console.log("📦 File prepared for upload:", file);

  const res = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });

  console.log("📡 Fetch POST sent to web3.storage");

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ Upload failed. Response:", errText);
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return `https://w3s.link/ipfs/${data.cid}`;
};

  const handleMint = async () => {
    if (!ipfsCID) return;
    setMinting(true);

    const sdk = new ThirdwebSDK("base");
    const contract = await sdk.getContract(CONTRACT_ADDRESS);
    const tx = await contract.erc721.mint({
      name: 'Froc Superstar Clip',
      description: 'From Base Idol',
      image: `https://w3s.link/ipfs/${ipfsCID}`
    });

    setMintedURL(`https://basescan.org/token/${CONTRACT_ADDRESS}?a=${tx.id}`);
    setMinting(false);
    console.log('✅ Minted NFT:', tx);
  };

  return (
    <div className="p-6 bg-black text-white text-center">
      <h2 className="text-xl font-bold mb-4">🎙️ Record Your Base Idol Track</h2>

      {!recording && (
        <button
          onClick={startRecording}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-semibold"
        >
          Start Recording
        </button>
      )}

      {recording && (
        <button
          onClick={stopRecording}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white font-semibold"
        >
          Stop Recording
        </button>
      )}

      {audioURL && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">🔊 Preview:</h3>
          <audio controls className="mt-2 w-full">
            <source src={audioURL} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {ipfsCID && (
        <div className="mt-6 text-green-400 text-sm">
          ✅ Uploaded to IPFS:
          <a
            href={`https://w3s.link/ipfs/${ipfsCID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            View on IPFS
          </a>
        </div>
      )}

      {ipfsCID && (
        <button
          onClick={handleMint}
          disabled={minting}
          className="mt-6 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white font-semibold"
        >
          {minting ? 'Minting...' : '🎟️ Mint this Clip'}
        </button>
      )}

      {mintedURL && (
        <div className="mt-4 text-blue-300 text-sm">
          ✅ Minted:
          <a href={mintedURL} target="_blank" rel="noopener noreferrer" className="underline ml-1">
            View on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}
