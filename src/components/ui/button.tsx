import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center md:text-lg text-base px-12 py-2 transition-transform duration-200 ease-in-out ',
  {
    variants: {
      variant: {
        default: 'bg-primary-700 text-white hover:bg-primary-900 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold border border-neutral-100',
        white: 'bg-white text-primary-700 hover:bg-neutral-100 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold',
        primary: 'bg-primary-300 text-white hover:bg-primary-400 has-[>svg]:gap-2 cursor-pointer font-medium rounded-[6px] text-b3',
      },
      size: {
        default: 'w-full',
        fit: 'w-fit',
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
