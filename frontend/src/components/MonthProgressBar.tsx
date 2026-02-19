import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function MonthProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();

            // First day of current month
            const firstDay = new Date(year, month, 1);
            // First day of next month
            const lastDay = new Date(year, month + 1, 1);

            // Total milliseconds in the month
            const totalMs = lastDay.getTime() - firstDay.getTime();
            // Elapsed milliseconds
            const elapsedMs = now.getTime() - firstDay.getTime();

            // Calculate percentage
            const percentage = (elapsedMs / totalMs) * 100;
            setProgress(Math.min(Math.max(percentage, 0), 100));
        };

        calculateProgress();
        // Update every hour
        const interval = setInterval(calculateProgress, 1000 * 60 * 60);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-border/20 to-border/10">
            <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
        </div>
    );
}
