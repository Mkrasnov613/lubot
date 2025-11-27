import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section className="h-screen flex flex-col justify-center items-center overflow-hidden">
      <Image
        src="/logo.png"
        width={86}
        height={86}
        alt=""
        className="absolute top-10 left-10 z-3"
      />
      <video width="1980" autoPlay muted loop className="relative z-0 w-full">
        <source src="bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/90 z-1" />
      <div className="absolute left-0 flex flex-col bg-bg1 w-[50vw] h-screen justify-center items-center z-2">
        <div className="flex flex-col justify-center items-start gap-5">
          <h1 className="text-7xl/20 max-w-120 text-text text-shadow-text text-shadow-lg/40">
            Your bot for{" "}
            <span className="text-[#9146FF] text-shadow-[#9146FF] text-shadow-lg/40">
              your
            </span>{" "}
            audience
          </h1>
          <p className="text-muted text-xl max-w-120">
            A streamer tool for automating live chat messages, moderation, and
            more
          </p>
          <Link
            href="http://localhost:3000/auth/twitch/login"
            className="flex bg-[#9146FF] h-13 w-56 rounded-xl text-text font-semibold items-center justify-around"
          >
            <Image src="/twitch.png" width={32} height={32} alt="" />
            Log in with Twitch
          </Link>
        </div>
      </div>
    </section>
  );
}
