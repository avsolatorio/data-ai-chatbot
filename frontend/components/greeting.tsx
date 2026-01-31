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
      className="flex flex-col items-center gap-2 text-center"
      key="overview"
    >
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {displayTitle}
      </motion.h1>
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="text-base text-muted-foreground md:text-lg"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        {displaySubtitle}
      </motion.p>
    </div>
  );
};
