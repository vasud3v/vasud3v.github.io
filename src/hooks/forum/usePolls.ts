import { useState, useCallback } from 'react';
import { PollData, User } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError } from '@/lib/supabase';
import { fetchPollForThread } from '@/lib/forumDataFetchers';

interface UsePollsParams {
    currentUser: User;
    setError: (key: string, error: ForumError, operation: string) => void;
}

export function usePolls({ currentUser, setError }: UsePollsParams) {
    const [pollsMap, setPollsMap] = useState<Record<string, PollData>>({});

    const getPollForThread = useCallback((threadId: string): PollData | null => {
        if (pollsMap[threadId]) return pollsMap[threadId];

        if (currentUser?.id) {
            fetchPollForThread(threadId, currentUser.id)
                .then((pollData) => {
                    if (pollData) {
                        setPollsMap((prev) => ({ ...prev, [threadId]: pollData }));
                    }
                })
                .catch((error) => {
                    console.warn('[usePolls] Could not fetch poll for thread:', threadId, error?.message || error);
                });
        }

        return null;
    }, [pollsMap, currentUser]);

    const votePoll = useCallback(async (threadId: string, optionIds: string[]) => {
        if (!currentUser?.id) return;

        const poll = pollsMap[threadId];
        if (!poll) return;

        if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
            setError(`poll-${threadId}`, new ForumError('Poll has expired', 'POLL_EXPIRED', 'This poll has ended.', false), 'votePoll');
            return;
        }

        if (!poll.isMultipleChoice && poll.hasVoted) {
            setError(`poll-${threadId}`, new ForumError('Already voted', 'ALREADY_VOTED', 'You have already voted.', false), 'votePoll');
            return;
        }

        const previousPoll = { ...poll };

        // Optimistic update
        setPollsMap((prev) => ({
            ...prev,
            [threadId]: {
                ...poll,
                options: poll.options.map((opt) => ({
                    ...opt,
                    votes: optionIds.includes(opt.id) ? opt.votes + 1 : opt.votes,
                })),
                totalVotes: poll.totalVotes + 1,
                hasVoted: true,
                votedOptionIds: optionIds,
            },
        }));

        try {
            const { data: pollData, error: pollError } = await supabase
                .from('polls').select('id').eq('thread_id', threadId).single();
            if (pollError || !pollData) throw pollError || new Error('Poll not found');

            const pollId = pollData.id;
            const votesToInsert = optionIds.map(optionId => ({
                poll_id: pollId, option_id: optionId, user_id: currentUser.id,
            }));
            const { error: voteError } = await supabase.from('poll_votes').insert(votesToInsert);
            if (voteError) throw voteError;

            for (const optionId of optionIds) {
                const { data: optionData, error: fetchError } = await supabase
                    .from('poll_options').select('votes').eq('id', optionId).single();
                if (fetchError) throw fetchError;
                const { error: updateError } = await supabase
                    .from('poll_options').update({ votes: (optionData?.votes || 0) + 1 }).eq('id', optionId);
                if (updateError) throw updateError;
            }

            const { error: totalError } = await supabase
                .from('polls').update({ total_votes: poll.totalVotes + 1 }).eq('id', pollId);
            if (totalError) throw totalError;
        } catch (error) {
            setPollsMap((prev) => ({ ...prev, [threadId]: previousPoll }));
            const forumError = handleSupabaseError(error, 'votePoll');
            setError(`poll-${threadId}`, forumError, 'votePoll');
        }
    }, [currentUser, pollsMap, setError]);

    const resetPolls = useCallback(() => {
        setPollsMap({});
    }, []);

    return {
        pollsMap,
        setPollsMap,
        getPollForThread,
        votePoll,
        resetPolls,
    };
}
