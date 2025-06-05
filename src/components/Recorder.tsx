import { useState, useRef } from 'react';

import { Client } from '@web3-storage/w3up-client';

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      uploadToIPFS(blob);
    };

    const uploadToIPFS = async (blob: Blob) => {
  const client = new Client();

  await client.login('craig@imoon.ai');
  await client.setCurrentSpace(process.env.SPACE_DID!);

  const file = new File([blob], 'frocbox-recording.webm', { type: 'video/webm' });
  const cid = await client.uploadFile(file);

  console.log('✅ Uploaded to IPFS:', cid);
};

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="p-6 bg-black text-white text-center">
      <h2 className="text-xl font-bold mb-4">🎤 Record Your Base Idol Track</h2>

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
    </div>
  );
}

export default Recorder;