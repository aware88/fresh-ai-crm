import * as RadixAccordion from '@radix-ui/react-accordion';
import React from 'react';
import { cn } from '@/lib/utils';

export const Accordion = RadixAccordion.Root;
export const AccordionItem = RadixAccordion.Item;

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixAccordion.Header asChild>
    <RadixAccordion.Trigger
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between py-2 text-left font-medium transition-all hover:underline focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </RadixAccordion.Trigger>
  </RadixAccordion.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>
>(({ className, children, ...props }, ref) => (
  <RadixAccordion.Content
    ref={ref}
    className={cn(
      'overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
      className
    )}
    {...props}
  >
    <div className="pt-2 pb-4">{children}</div>
  </RadixAccordion.Content>
));
AccordionContent.displayName = 'AccordionContent'; 