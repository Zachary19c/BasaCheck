import type { SVGProps } from "react";

// Small stroke icons drawn for BasaCheck: 1.75px stroke, round caps, 20px box.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 10H4M9 5l-5 5 5 5" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10h12M11 5l5 5-5 5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5l5 5-5 5" />
    </Icon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7.25" y="2.75" width="5.5" height="9.5" rx="2.75" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
    </Icon>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="5" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function HandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 10V4.5a1.25 1.25 0 0 1 2.5 0V9m0-1V3.25a1.25 1.25 0 0 1 2.5 0V9m0-4.5a1.25 1.25 0 0 1 2.5 0V11a6 6 0 0 1-6 6h-.6a5 5 0 0 1-3.9-1.9L3.3 12.6a1.3 1.3 0 0 1 2-1.6L7 12.7" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M10 2.5c.5 3.6 2 5.6 5.5 6.5-3.5.9-5 2.9-5.5 6.5-.5-3.6-2-5.6-5.5-6.5 3.5-.9 5-2.9 5.5-6.5Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </Icon>
  );
}
