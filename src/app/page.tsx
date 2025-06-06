'use client';

import Recorder from '../components/Recorder';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Client } from '@web3-storage/w3up-client';
import { useState } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-2">FrocBox</h1>
        <p className="mb-4">Your onchain meme jukebox. Built on Base.</p>
        <ConnectButton />
      </div>

      <div className="mt-10 max-w-xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <video controls className="w-full" poster="/animation/fren.png">
          <source src="/animation/sample.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="bg-black text-white p-4 text-center">
        <h2 className="text-lg font-semibold">Fake Candle Dreams</h2>
        <p className="text-sm text-gray-300">ft. Slim Wojak</p>
      </div>

      <div className="mt-4 text-center bg-black p-4">
        <a
          href="https://zora.co/collect/base/0xb4ba871d146963020093f0957bdc710368bb17885"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-500 transition"
        >
          Mint on Zora
        </a>
      </div>

      <div className="mt-10">
        <ThirdwebProvider
          sdkOptions={{
            tracking: {
              enabled: false
            }
          }}
        >
          <Recorder />
        </ThirdwebProvider>
      </div>
    </main>
  );
}
