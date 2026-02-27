import { useState, useEffect } from 'react';
import { BarChart3, Check } from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import { formatDaysLeft } from '@/lib/forumUtils';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  isMultipleChoice: boolean;
  hasVoted: boolean;
  votedOptionIds: string[];
}

interface ThreadPollProps {
  poll: PollData;
  threadId: string;
}

export default function ThreadPoll({ poll: initialPoll, threadId }: ThreadPollProps) {
  const { votePoll } = useForumContext();
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialPoll.votedOptionIds
  );
  const isExpired = new Date(poll.endsAt).getTime() <= Date.now();
  const showResults = poll.hasVoted || isExpired;

  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  const handleVote = () => {
    if (selectedOptions.length === 0 || poll.hasVoted) return;
    votePoll(threadId, selectedOptions);
  };

  const toggleOption = (optId: string) => {
    if (poll.hasVoted || isExpired) return;
    if (poll.isMultipleChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optId)
          ? prev.filter((id) => id !== optId)
          : [...prev, optId]
      );
    } else {
      setSelectedOptions([optId]);
    }
  };

  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forum-border/20 bg-forum-card-alt/30">
        <BarChart3 size={13} className="text-forum-pink" />
        <span className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider">
          Poll
        </span>
        {poll.isMultipleChoice && (
          <span className="text-[8px] font-mono text-forum-muted bg-forum-bg px-1.5 py-0.5 rounded-sm border border-forum-border/30">
            Multiple Choice
          </span>
        )}
        <span className="ml-auto text-[9px] font-mono text-forum-muted">
          {poll.totalVotes.toLocaleString()} votes ·{' '}
          {formatDaysLeft(poll.endsAt)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-[13px] font-mono font-bold text-forum-text">
          {poll.question}
        </h3>

        <div className="space-y-2">
          {poll.options.map((option) => {
            const pct =
              poll.totalVotes > 0
                ? (option.votes / poll.totalVotes) * 100
                : 0;
            const isSelected = selectedOptions.includes(option.id);
            const isWinning = option.votes === maxVotes && showResults;

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={poll.hasVoted || isExpired}
                className={`relative w-full text-left rounded-md border overflow-hidden transition-forum ${isSelected && !showResults
                  ? 'border-forum-pink/50 bg-forum-pink/[0.06]'
                  : isSelected && showResults
                    ? 'border-forum-pink/40 bg-forum-pink/[0.04]'
                    : 'border-forum-border/30 bg-forum-bg/50 hover:border-forum-border/50'
                  } ${poll.hasVoted || isExpired ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isWinning ? 'bg-forum-pink/15' : 'bg-forum-border/20'
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    {!showResults && (
                      <div
                        className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center ${isSelected
                          ? 'border-forum-pink bg-forum-pink/20'
                          : 'border-forum-border/50'
                          }`}
                      >
                        {isSelected && (
                          <Check size={8} className="text-forum-pink" />
                        )}
                      </div>
                    )}
                    <span
                      className={`text-[11px] font-mono ${isWinning ? 'text-forum-pink font-semibold' : 'text-forum-text'}`}
                    >
                      {option.text}
                    </span>
                    {isSelected && showResults && (
                      <span className="text-[8px] font-mono text-forum-pink bg-forum-pink/10 px-1 py-0.5 rounded-sm">
                        Your vote
                      </span>
                    )}
                  </div>
                  {showResults && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${isWinning ? 'text-forum-pink' : 'text-forum-muted'}`}
                    >
                      {pct.toFixed(1)}% ({option.votes})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!poll.hasVoted && !isExpired && (
          <button
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            className="transition-forum rounded-md bg-forum-pink px-4 py-1.5 text-[10px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cast Vote
          </button>
        )}
      </div>
    </div>
  );
}
