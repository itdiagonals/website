import Link from "next/link";
import { Button } from "./ui/button";

interface ThemeDescProps {
	type: "current-season" | "all-season";
	title: string;
	subtitle?: string;
	desc: string;
	href: string;
}

export default function ThemeDesc({ type, title, subtitle, desc, href }: ThemeDescProps) {
	const isCurrent = type === "current-season";

	return (
		<section className="w-full">
			<div className="relative bg-primary-500 text-neutral-100 pt-12.25 pb-[49.5px] px-6">
				<div className="absolute inset-0 bg-[url('/bg3.svg')] bg-no-repeat bg-center-left bg-size-[700px] opacity-90"></div>
				<div className="relative z-10">
					<div className="grid grid-cols-3 w-full items-center">
						<div className="flex flex-col gap-5">
							{isCurrent && (
								<p className="text-[21px] font-normal leading-5">
									Theme of the season
								</p>
							)}
							<h2 className="text-3xl font-bold leading-12 max-w-85 uppercase">
								{title}
							</h2>
						</div>
						<p className="justify-start text-sm font-normal leading-5">
							{isCurrent ? (subtitle || "Breeze of the Game") : "Never stops wearing your passion"}
						</p>
						<div className="gap-9 flex flex-col">
							<div className="text-sm font-normal leading-5">
								{desc}
							</div>
							<Link href={href} className="w-fit">
							<Button
								variant="outline"
							>
									Explore Now
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
