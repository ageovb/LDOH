import { Background } from "@/components/common/Background";
import { Navigation } from "@/components/common/Navigation";

export default function OpenProjectsPage() {
  return (
    <>
      <Background />
      <Navigation />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-brand-text sm:text-4xl">
          暂未开发
        </h1>
      </main>
    </>
  );
}
