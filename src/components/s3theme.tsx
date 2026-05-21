import Image from "next/image";
export default function S3Theme() {

    return (
        <section className="w-full">
            <div className="relative bg-primary-500 text-neutral-100 pt-[49px] pb-[49.5px] px-6">
                <div className="absolute inset-0 bg-[url('/bg3.svg')] bg-no-repeat bg-left-top bg-[length:700px] opacity-90"></div>
                <div className="relative z-10">
                    <div className="grid grid-cols-3 w-full items-center">
                        <div className="flex flex-col gap-[20px]">
                            <p className="text-[21px] font-normal leading-5">theme of the season</p>
                            <h2 className="text-3xl font-bold leading-[48px]">
                                CROSS PLAYER<br />MULTINANCE
                            </h2>
                        </div>
                        <p className=" justify-start text-sm font-normal leading-5">Breeze of the Game</p>
                        <div className="gap-[36px] flex flex-col">
                            <div className="text-sm font-normal leading-5">
                                Lorem ipsum dolor sit amet consectetur. Amet id et massa sem feugiat nec. Elementum pellentesque id lacus massa quis. Metus proin dignissim tincidunt gravida. Magnis quis faucibus viverra tempor cursus et eget velit non. Id volutpat diam convallis suspendisse in adipiscing at. Posuere nam felis mauris amet.
                            </div>
                            <button className="w-[191px] relative border-solid border-[0.8px] box-border flex items-center justify-center p-[7.9px] text-left text-[17.44px] ">
                                <p className=" relative leading-[26.15px]">Explore Now</p>
                            </button>
                        </div>
                    </div>
                </div>

            </div>



            {/*INI ROW GALERY*/}
            <div className="grid grid-cols-3 w-full h-[400px]">

                <div className="relative">
                    <Image
                        src="/image-2.png"
                        alt="img1"
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="relative">
                    <Image
                        src="/image-1.png"
                        alt="img2"
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="relative">
                    <Image
                        src="/image-3.png"
                        alt="img3"
                        fill
                        className="object-cover"
                    />
                </div>

            </div>
        </section>
    )
}
