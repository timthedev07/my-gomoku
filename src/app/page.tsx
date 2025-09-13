import { PlayUI } from "@/ui/PlayUI";

export default function Home() {
  return (
    <div className="w-full text-center flex flex-col items-center justify-center">
      <header className="text-center my-12">
        <h1 className="text-4xl font-semibold">Play Gomoku!</h1>
        <PlayUI />
      </header>
    </div>
  );
}
