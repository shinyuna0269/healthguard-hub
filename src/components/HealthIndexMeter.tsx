import { motion } from "framer-motion";
import { useRole } from "@/contexts/RoleContext";

interface HealthIndexMeterProps {
  score: number;
}

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-health-excellent";
  if (score >= 60) return "text-health-good";
  if (score >= 40) return "text-health-fair";
  if (score >= 20) return "text-health-poor";
  return "text-health-critical";
};

const getHealthLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Critical";
};

const getStrokeColor = (score: number) => {
  if (score >= 80) return "hsl(152, 60%, 40%)";
  if (score >= 60) return "hsl(80, 60%, 45%)";
  if (score >= 40) return "hsl(38, 92%, 50%)";
  if (score >= 20) return "hsl(15, 80%, 50%)";
  return "hsl(0, 72%, 51%)";
};

const HealthIndexMeter = ({ score }: HealthIndexMeterProps) => {
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <motion.circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-bold font-heading ${getHealthColor(score)}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Index</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${getHealthColor(score)}`}>{getHealthLabel(score)}</span>
    </div>
  );
};

export default HealthIndexMeter;
