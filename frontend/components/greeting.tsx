import { motion } from "framer-motion";

const DEFAULT_TITLE = "What would you like to explore?";
const DEFAULT_SUBTITLE =
  "Ask a question, get insights, or try one of the suggestions below.";

type GreetingProps = {
  title?: string;
  subtitle?: string;
};

export const Greeting = ({ title, subtitle }: GreetingProps) => {
  const displayTitle = title?.trim() || DEFAULT_TITLE;
  const displaySubtitle = subtitle?.trim() ?? DEFAULT_SUBTITLE;

  return (
    <div
      className="flex flex-col items-center gap-4 text-center"
      key="overview"
    >
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl font-semibold tracking-tight text-foreground text-3xl leading-tight md:text-5xl md:leading-[1.2]"
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
