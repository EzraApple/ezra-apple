import type { HTMLAttributes, Ref } from "react";
import type { RepeatType, Transition, Variants } from "motion/react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { m, useAnimation, useReducedMotion } from "motion/react";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: string | number;
  loop?: boolean;
  animateOnMount?: boolean;
}

interface CopyIconProps extends AnimatedIconProps {
  ref?: Ref<AnimatedIconHandle>;
}

const copyTransition: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 17,
  mass: 1,
};

export function CopyIcon({
  ref,
  onMouseEnter,
  onMouseLeave,
  className,
  size = 28,
  loop = false,
  animateOnMount = false,
  ...props
}: CopyIconProps) {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const shouldReduceMotion = useReducedMotion() ?? false;

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => {
          if (!shouldReduceMotion) void controls.start("animate");
        },
        stopAnimation: () => {
          if (!shouldReduceMotion) void controls.start("normal");
        },
      };
    });

    useEffect(() => {
      if (
        !shouldReduceMotion &&
        (loop || animateOnMount) &&
        !isControlledRef.current
      ) {
        void controls.start("animate");
      }
    }, [loop, animateOnMount, controls, shouldReduceMotion]);

    const handleMouseEnter = useCallback(
      async (event: React.MouseEvent<HTMLDivElement>) => {
        if (!shouldReduceMotion && !isControlledRef.current && !loop) {
          await controls.start("animate");
        } else {
          onMouseEnter?.(event);
        }
      },
      [controls, onMouseEnter, loop, shouldReduceMotion],
    );

    const handleMouseLeave = useCallback(
      async (event: React.MouseEvent<HTMLDivElement>) => {
        if (!shouldReduceMotion && !isControlledRef.current && !loop) {
          await controls.start("normal");
        } else {
          onMouseLeave?.(event);
        }
      },
      [controls, onMouseLeave, loop, shouldReduceMotion],
    );

    const repeatStyles = {
      repeat: loop ? Number.POSITIVE_INFINITY : animateOnMount ? 1 : 0,
      repeatType: (loop || animateOnMount ? "reverse" : undefined) as
        | RepeatType
        | undefined,
      repeatDelay: loop ? 1 : 0,
    };

    return (
      <div
        className={className}
        onMouseEnter={(event) => void handleMouseEnter(event)}
        onMouseLeave={(event) => void handleMouseLeave(event)}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
        >
          <m.rect
            animate={controls}
            height="14"
            rx="2"
            ry="2"
            transition={{ ...copyTransition, ...repeatStyles }}
            variants={{
              normal: { translateY: 0, translateX: 0 },
              animate: { translateY: -3, translateX: -3 },
            }}
            width="14"
            x="8"
            y="8"
          />
          <m.path
            animate={controls}
            d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
            transition={{ ...copyTransition, ...repeatStyles }}
            variants={{
              normal: { x: 0, y: 0 },
              animate: { x: 3, y: 3 },
            }}
          />
        </svg>
      </div>
    );
}

const checkVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: { duration: 0.3, opacity: { duration: 0.1 } },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: { duration: 0.4, opacity: { duration: 0.1 } },
  },
};

export function CircleCheckIcon({
  className,
  size = 28,
  animateOnMount = false,
  ...props
}: AnimatedIconProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div className={className} {...props}>
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
      >
        <circle cx="12" cy="12" r="10" />
        <m.path
          animate={animateOnMount && !shouldReduceMotion ? "animate" : "normal"}
          d="m9 12 2 2 4-4"
          initial="normal"
          transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
          variants={checkVariants}
        />
      </svg>
    </div>
  );
}
