import React from "react";
export default function Hero() {
  return (
    <section
      style={{
        backgroundImage: "url('/Frame1.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative w-full auto h-[821px] overflow-hidden text-neutral-100 font-[DorivalUITrial]"
    >
      <div className="absolute top-0 left-0 w-full h-[154px] bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute top-[483px] left-0 w-full h-[338px] flex -rotate-180 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" />
      <div className="flex flex-col w-full items-start absolute top-[636px] left-[calc(50%_-_590px)]">
        <h4 className="relative w-fit mt-[-1.00px] font-[Handi] font-normal text-lg leading-[27px]">
          Joining the Style
        </h4>
        <h1 className="relative w-fit text-7xl font-bold leading-[102px]">
          New Arrival
        </h1>
      </div>
    </section>
  );
}
