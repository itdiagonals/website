import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center md:text-lg text-base py-2 transition-transform duration-200 ease-in-out ',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100/50 text-white hover:bg-primary-900 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold border border-neutral-100',
        white: 'bg-white text-black hover:bg-neutral-100 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold',
        outline: 'bg-transparent text-white  has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold border border-neutral-100',
        transparent: 'bg-white/40 text-black hover:bg-neutral-100 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold',
        black: 'bg-primary-400 text-white hover:bg-primary-500 has-[>svg]:gap-2 cursor-pointer hover:scale-101 font-bold',
      },
      size: {
        default: 'w-[190px]',
        icon: 'p-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
}

function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}

export { Button, buttonVariants };
