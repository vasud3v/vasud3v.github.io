import { useState, useCallback } from 'react';
import { ErrorState } from '@/types/forum';
import { ForumError } from '@/lib/supabase';

export function useForumErrors() {
    const [errors, setErrors] = useState<Map<string, ErrorState>>(new Map());
    const [connectionWarning, setConnectionWarning] = useState<string | null>(null);

    const setError = useCallback((key: string, error: ForumError, operation: string) => {
        setErrors(prev => {
            const updated = new Map(prev);
            updated.set(key, {
                message: error.userMessage,
                code: error.code,
                timestamp: Date.now(),
                operation,
            });
            return updated;
        });

        // Auto-clear error after 5 seconds
        setTimeout(() => {
            setErrors(prev => {
                const updated = new Map(prev);
                updated.delete(key);
                return updated;
            });
        }, 5000);
    }, []);

    const clearError = useCallback((key: string) => {
        setErrors(prev => {
            const updated = new Map(prev);
            updated.delete(key);
            return updated;
        });
    }, []);

    const dismissConnectionWarning = useCallback(() => {
        setConnectionWarning(null);
    }, []);

    return {
        errors,
        setError,
        clearError,
        connectionWarning,
        setConnectionWarning,
        dismissConnectionWarning,
    };
}
