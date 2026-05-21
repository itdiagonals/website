import React from "react";

export default function CrossPlayer1() {
  return (
    <section
      style={{
        backgroundImage: "url('/CrossPlayer1.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative w-[1442px] h-[821px] overflow-hidden bg-cover text-neutral-100 font-[DorivalUITrial]"
    >
      <div className="absolute top-0 left-[-29px] h-[154px] w-[1462px] bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" />

      <div className="absolute top-[483px] left-0 w-[1441px] h-[338px] flex -rotate-180 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]">
        <div className="flex mt-[87.1px] w-[191px] h-[42.85px] ml-[70px] relative items-center justify-center gap-[7.93px] p-[7.93px] bg-[#ffffff80] border-[0.79px] border-solid rotate-180">
          <button className="relative w-fit mt-[-0.79px] font-bold text-lg leading-[26.2px]">
            Explore Now
          </button>
        </div>
      </div>

      <div className="flex flex-col w-[1001px] items-start absolute top-[636px] left-[calc(50%_-_603px)]">
        <h4 className="relative w-[446px] mt-[-1.00px] font-[Handi] font-normal text-lg leading-[27px]">
          Theme of the season!
        </h4>
        <h1 className="relative w-fit text-7xl font-bold leading-[102px]">
          Cross Player
        </h1>
      </div>
    </section>
  );
}
