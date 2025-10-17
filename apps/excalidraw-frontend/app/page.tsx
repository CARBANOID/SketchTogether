"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8] text-gray-800 font-[Space_Grotesk]">
      {/* Header */}
      <header className="w-full border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between p-2 md:px-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <svg
              className="h-8 w-8 text-[#13a4ec]"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">SketchTogether</h1>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <Button
              varaint="secondary"
              size="md"
              text="Sign In"
              customStyle="bg-[#13a4ec] text-white hover:bg-[#1193d5] transition"
              onClick={() => router.push("/auth/signin")}
            />
            <Button
              varaint="primary"
              size="md"
              text="Sign Up"
              customStyle="bg-[#13a4ec]/20 text-[#13a4ec] hover:bg-[#13a4ec]/30 transition"
              onClick={() => router.push("/auth/signup")}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center mt-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-4xl md:text-[48px] font-bold tracking-tighter text-gray-900">
                Live Collaborative Drawing.
                <span className="block text-[#13a4ec]">Instantly.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600">
                Unleash your creativity with a real-time digital whiteboard.
                Sketch ideas,brainstorm with your team, and communicate visually with live chat.
              </p>
            </div>

            {/* Hero Image from Link */}
            <div className="max-w-120 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhcDVb0uNTaq6Y_hW5DRlFAqHKRqPzuZTxDXJamhaH2rA1CgyidqHJL54HDw5G7vOabR79wrlePWsXs1aES6dRAw9Y_Hsfr1vAlyVaQfNNEjhSXa5l3E21DpdcjGcqGPTvawoNqxqIJQ6io7FbwP03tU0dKIOsXjcoC6leZtsu0b4cGe8PQLUkVasTHg2Vg5eLCnx9hfOAnYSJDbLY55ecUyyXEsBCp_LX7MByMVbCLaAUUsEjAqL3BYy7WK1q1VLRkN8KgCbQt3c"
              alt="Live collaborative drawing preview"
              className="max-w-120 max-h-120 object-cover"
            />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
