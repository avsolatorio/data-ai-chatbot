import { motion } from "framer-motion";

const DEFAULT_TITLE = "What would you like to explore?";
const DEFAULT_SUBTITLE =
  "Ask a question, get insights, or try one of the suggestions below.";
const DEFAULT_EYEBROW = "Data 360 Chat";

type GreetingProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  variant?: "default" | "landing";
};

export const Greeting = ({
  title,
  subtitle,
  eyebrow,
  variant = "default",
}: GreetingProps) => {
  const displayTitle = title?.trim() || DEFAULT_TITLE;
  const displaySubtitle = subtitle?.trim() ?? DEFAULT_SUBTITLE;
  const displayEyebrow = eyebrow?.trim() || DEFAULT_EYEBROW;

  if (variant === "landing") {
    return (
      <div className="flex flex-col items-start gap-4 text-left" key="overview">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold uppercase tracking-[1px] text-white"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          {displayEyebrow}
        </motion.p>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[640px] text-4xl font-bold leading-tight text-white md:text-[48px]"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {displayTitle}
        </motion.h1>
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[645px] text-lg text-white/95 md:text-xl"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          {displaySubtitle}
        </motion.p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 text-center"
      key="overview"
    >
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl font-semibold tracking-tight text-[#184683] text-3xl leading-tight md:text-5xl md:leading-[1.2]"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        {displayTitle}
      </motion.h1>
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-muted-foreground text-base leading-relaxed md:text-lg"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        {displaySubtitle}
      </motion.p>
    </div>
  );
};
