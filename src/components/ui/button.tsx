import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center rounded-lg md:text-base text-sm px-6 py-[10px] transition-transform duration-200 ease-in-out ',
  {
    variants: {
      variant: {
        default: 'bg-primary-700 text-white hover:bg-primary-900 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold',
        white: 'bg-white text-primary-700 hover:bg-neutral-100 has-[>svg]:gap-2 cursor-pointer hover:scale-105 font-bold',
      },
      size: {
        default: 'md:w-53 w-full',
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
