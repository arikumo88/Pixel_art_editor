import PixelArtEditor from "@/components/pixel-art-editor"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-2xl font-bold mb-4">Pixel Art Editor</h1>
        <PixelArtEditor />
      </div>
    </main>
  )
}

