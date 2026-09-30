'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Users,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Loader2,
  ArrowUpRight,
  Check,
  CornerDownLeft,
  Sparkles,
  Github,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { generateGuestName } from '@/lib/utils';
import { useRoomStore } from '@/store/room-store';
import { useSocket } from '@/hooks/use-socket';
import { toast } from '@/hooks/use-toast';
import type { CreateRoomResponse } from '@syncroom/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsTiles } from '@/components/stats-tiles';

export function LandingHero() {
  const router = useRouter();
  const [actionType, setActionType] = useState<'create' | 'join' | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setMember, setRoomState } = useRoomStore();

  useSocket();

  useEffect(() => {
    apiFetch('/health').catch(() => {});
  }, []);

  const getDisplayName = () => name.trim() || generateGuestName();

  const handleCreateRoom = async () => {
    setLoading(true);
    const displayName = getDisplayName();

    try {
      const restResult = await apiFetch<CreateRoomResponse>('/rooms', {
        method: 'POST',
        body: JSON.stringify({ name: displayName }),
      });

      const socket = useRoomStore.getState().socket;

      if (!socket?.connected) {
        router.push(
          `/room/${restResult.code}?memberId=${restResult.memberId}&name=${encodeURIComponent(
            restResult.memberName,
          )}&created=true`,
        );
        return;
      }

      socket.emit('create-room', { name: displayName }, (response) => {
        if (response.success && response.room && response.memberId) {
          setMember(response.memberId, response.memberName ?? displayName);

          setRoomState({
            room: response.room,
            queue: response.queue ?? [],
            currentIndex: response.currentIndex ?? -1,
          });

          try {
            localStorage.setItem(
              `vynyl_room_${response.room.code.toUpperCase()}`,
              JSON.stringify({
                memberId: response.memberId,
                name: response.memberName ?? displayName,
              }),
            );
          } catch (e) {
            console.error(e);
          }

          router.push(`/room/${response.room.code}?created=true`);
        } else {
          router.push(
            `/room/${restResult.code}?memberId=${restResult.memberId}&name=${encodeURIComponent(
              restResult.memberName,
            )}&created=true`,
          );
        }
      });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : '';
      const isNetworkError =
        errMessage.toLowerCase().includes('failed to fetch') ||
        errMessage.toLowerCase().includes('networkerror');

      toast({
        title: isNetworkError
          ? 'Server Spin-up In Progress'
          : 'Failed to create room',
        description: isNetworkError
          ? 'The server is waking up (Render free tier can take up to 60 seconds to spin up). Please wait a moment and try again.'
          : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    const displayName = getDisplayName();

    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Room codes must be exactly 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const socket = useRoomStore.getState().socket;

      if (!socket?.connected) {
        router.push(`/room/${code}?name=${encodeURIComponent(displayName)}`);
        return;
      }

      socket.emit('join-room', { code, name: displayName }, (response) => {
        if (response.success && response.room && response.memberId) {
          setMember(response.memberId, response.memberName ?? displayName);

          setRoomState({
            room: response.room,
            queue: response.queue ?? [],
            currentIndex: response.currentIndex ?? -1,
          });

          try {
            localStorage.setItem(
              `vynyl_room_${response.room.code.toUpperCase()}`,
              JSON.stringify({
                memberId: response.memberId,
                name: response.memberName ?? displayName,
              }),
            );
          } catch (e) {
            console.error(e);
          }

          router.push(`/room/${response.room.code}`);
        } else {
          toast({
            title: 'Room not found',
            description: 'Please double-check the code and try again.',
            variant: 'destructive',
          });
        }

        setLoading(false);
      });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : '';
      const isNetworkError =
        errMessage.toLowerCase().includes('failed to fetch') ||
        errMessage.toLowerCase().includes('networkerror');

      toast({
        title: isNetworkError ? 'Server Spin-up In Progress' : 'Failed to join',
        description: isNetworkError
          ? 'The server is waking up (Render free tier can take up to 60 seconds to spin up). Please wait a moment and try again.'
          : 'Please try again.',
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden font-satoshi flex flex-col justify-between">
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-screen">
        <div className="w-full lg:w-[48%] px-6 sm:px-12 lg:pl-16 lg:pr-12 py-10 flex flex-col justify-between min-h-[85vh] lg:min-h-screen z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="relative h-7 w-7 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-foreground/20 flex items-center justify-center animate-spin-slow">
                  <div className="h-5 w-5 rounded-full border border-foreground/30 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full border border-foreground/40 flex items-center justify-center">
                      <div className="h-1 w-1 bg-foreground rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <span className="text-xl font-bold tracking-tight text-foreground font-satoshi lowercase">
                vynyl
              </span>
            </div>

            <div className="flex items-center gap-3.5">
  <ThemeToggle />
  <span className="rounded-full bg-secondary px-3.5 py-1 text-[11px] font-bold text-secondary-foreground tracking-wider uppercase">
    ✦ 100% Free
  </span>
</div>

          <div className="space-y-5 mt-8 md:mt-12 mb-auto max-w-lg">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-canela leading-[1.15]">
                Listen to music,
                <br />
                <span className="relative inline-block mt-1 italic font-normal">
                  together.
                  <span className="absolute -bottom-2.5 left-0 right-0 h-1.5 bg-primary opacity-75 rounded-full" />
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-satoshi pt-1">
                Create a room, invite your people, and jam in real time.
              </p>
            </div>

            <div className="pt-1">
              <AnimatePresence mode="wait">
                {actionType === null ? (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <button
                      onClick={() => setActionType('create')}
                      className="group flex items-center justify-center gap-2 rounded-2xl bg-foreground px-7 py-4 text-sm font-semibold text-background shadow-md transition-all duration-200 hover:-translate-y-[2px] active:scale-98 hover:shadow-lg"
                    >
                      Create a room
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActionType('join')}
                      className="group flex items-center justify-center gap-2 rounded-2xl bg-secondary px-7 py-4 text-sm font-semibold text-secondary-foreground shadow-sm transition-all duration-200 hover:-translate-y-[2px] active:scale-98 hover:shadow-md hover:bg-accent"
                    >
                      Join a room
                      <ArrowUpRight className="h-4 w-4 group-hover:translate-y-[-1px] group-hover:translate-x-[1px] transition-transform" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-3 bg-card/60 p-4 rounded-2xl border border-border max-w-md shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase pl-1">
                          Your Name
                        </label>

                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                          maxLength={32}
                          autoFocus
                        />
                      </div>

                      {actionType === 'join' && (
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase pl-1">
                            Room Code
                          </label>

                          <input
                            type="text"
                            placeholder="Enter 6-character code"
                            value={joinCode}
                            onChange={(e) =>
                              setJoinCode(e.target.value.toUpperCase())
                            }
                            maxLength={6}
                            className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground font-semibold placeholder:text-muted-foreground tracking-wider uppercase focus:outline-none focus:border-primary transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        onClick={
                          actionType === 'create'
                            ? handleCreateRoom
                            : handleJoinRoom
                        }
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-semibold flex items-center justify-center gap-2 shadow-md transition-all hover:-translate-y-[2px]"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {actionType === 'create'
                              ? 'Create Room'
                              : 'Join Room'}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => {
                          setActionType(null);
                          setJoinCode('');
                        }}
                        disabled={loading}
                        className="py-3.5 px-4 rounded-xl bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-all"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-border/40">
              {[
                ['Real-time sync', 'Everyone hears the exact same moment.', Zap],
                ['Works anywhere', 'On any device. No installs.', Globe],
                ['No login', 'Jump in instantly with just a name.', Lock],
                ['Totally Free', '100% free forever. No ads.', Sparkles],
              ].map(([title, description, Icon]) => (
                <div
                  key={title as string}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-card/60 border border-border shadow-sm"
                >
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-secondary flex items-center justify-center border border-border">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                      {title as string}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-0.5 font-medium">
                      {description as string}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <StatsTiles />
          </div>

          <div className="h-10 hidden lg:block" />
        </div>

        <div className="hidden lg:block lg:w-[52%] relative min-h-screen overflow-hidden select-none">
          <img
            src="/webpage_hero.png"
            alt="Warm Scandinavian vinyl record player setup"
            className="absolute inset-0 w-full h-full object-cover object-right select-none scale-102"
          />

          <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none" />

          <div className="absolute top-8 right-8 z-10 flex items-center gap-4">
            <span className="rounded-full bg-secondary px-4 py-1 text-[11px] font-bold text-secondary-foreground tracking-wider uppercase shadow-sm">
              ✦ 100% Free
            </span>

            <span className="text-[11px] text-white font-semibold tracking-wide bg-black/45 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
              No login required
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-black/15 pointer-events-none" />
        </div>
      </div>

      <section className="w-full py-16 px-6 sm:px-12 lg:px-16 bg-background border-t border-border z-10 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-canela">
              Jam with your friends in real-time.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground font-medium font-satoshi leading-relaxed">
              vynyl is a shared listening room where friends can play music
              together, build a queue, and listen in sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
            <div className="space-y-4 text-left">
              <h3 className="text-lg font-bold text-primary font-canela uppercase tracking-wider">
                What is vynyl?
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed font-satoshi">
                vynyl is a lightweight, login-free social music platform built
                on top of YouTube's massive library. It allows you to
                synchronize audio streams across multiple devices. When the
                host plays, pauses, or seeks a track, every listener hears the
                exact same moment in real-time.
              </p>

              <h3 className="text-lg font-bold text-primary font-canela uppercase tracking-wider pt-2">
                Learn More
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed font-satoshi">
                Want to dive deeper into our technology, architecture, and
                background story? Read the{' '}
                <a
                  href="/about"
                  className="text-primary hover:underline font-bold transition-all"
                >
                  About Vynyl
                </a>{' '}
                page.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <h3 className="text-lg font-bold text-primary font-canela uppercase tracking-wider">
                How to use it
              </h3>

              <ol className="space-y-3.5 text-sm text-muted-foreground font-satoshi">
                {[
                  'Enter your name and click the create button on the home page.',
                  'Copy the unique 6-character room code and send it to your group.',
                  'Search for your favorite tracks and load them into the collaborative playlist.',
                  'Sit back and enjoy. Every playback action is instantly mirrored for all members.',
                ].map((text, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                      {index + 1}
                    </span>

                    <span>
                      <strong>
                        {[
                          'Create a Room:',
                          'Invite Friends:',
                          'Search & Queue:',
                          'Listen in Sync:',
                        ][index]}
                      </strong>{' '}
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function LandingFooter() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      className={`w-full py-10 px-6 sm:px-12 lg:px-16 border-t border-border bg-card transition-opacity duration-500 ease-in-out ${
        scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-[12px] leading-relaxed text-muted-foreground font-satoshi">
        <div className="max-w-xl space-y-3">
          <p>
            Audio is streamed through YouTube’s embedded player; all rights
            remain with the respective labels, composers and performers.
            Nothing is hosted here. Song credits are compiled from YouTube's
            search listings.
          </p>

          <p className="font-semibold text-foreground">
            Hold rights to something here and want it removed? Email{' '}
            <a
              href="mailto:11n44sourjeshmukherjee@gmail.com"
              className="text-primary hover:underline font-bold transition-all"
            >
              11n44sourjeshmukherjee@gmail.com
            </a>{' '}
            and it comes down.
          </p>
        </div>

        <div className="flex flex-col md:items-end justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-foreground/20 flex items-center justify-center animate-spin-slow">
                <div className="h-5 w-5 rounded-full border border-foreground/30 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full border border-foreground/40 flex items-center justify-center">
                    <div className="h-1 w-1 bg-foreground rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <span className="text-xl font-bold tracking-tight text-foreground font-satoshi lowercase">
              vynyl
            </span>
          </div>

          <div className="flex flex-col md:items-end gap-1.5">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2.5">
              <span>
                &copy; {new Date().getFullYear()} vynyl. Built by{' '}
                <span className="text-foreground font-bold">
                  Sourjesh Mukherjee
                </span>
              </span>

              <span className="inline-flex items-center gap-2 border-l border-border pl-2.5">
                <a
                  href="https://github.com/sourjesh-git/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="GitHub Profile"
                >
                  <Github className="h-4.5 w-4.5" />
                </a>

                <a
                  href="https://www.linkedin.com/in/sourjesh-mukherjee-5ba657258/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-border flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <a href="/about" className="hover:text-primary transition-colors">
          About
        </a>

        <span className="text-muted-foreground/30">•</span>

        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Sitemap
        </a>

        <span className="text-muted-foreground/30">•</span>

        <a
          href="/robots.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Robots.txt
        </a>
      </div>
    </footer>
  );
}
