import { useState, useEffect } from "react";

export function useTimedMessage(initialValue, duration = 5000) {
    const [msg, setMsg] = useState(initialValue);
    useEffect(() => {
        if (msg) {
            const timer = setTimeout(() => setMsg(null), duration);
            return () => clearTimeout(timer);
        }
    }, [msg]);
    return [msg, setMsg];
}