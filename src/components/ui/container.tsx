import { cn } from "@/lib/utils";

const Container = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return (
    <section
      className={cn(
        `mx-auto flex w-full max-w-400 flex-col gap-4 overflow-hidden px-4 md:px-10 xl:px-12`,
        className
      )}
    >
      {children}
    </section>
  );
};

export default Container;