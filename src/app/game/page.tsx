import dynamic from 'next/dynamic';

const FreeconFrontierGame = dynamic(() => import('./FreeconFrontierGame'), {
  // This will only render on client side
  ssr: false,
});

export default function FreeconFrontierGamePage() {
    return (
        <div>
            <FreeconFrontierGame />
        </div>
    );
}