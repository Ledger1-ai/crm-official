"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  PhoneOff,
  UserCheck,
  Coffee,
  Power,
  X,
  Delete,
  Hash,
  ChevronDown,
  ChevronUp,
  Activity,
  User
} from "lucide-react";

/**
 * CustomCCP
 * Fully custom, on-theme Amazon Connect CCP built on Streams SDK.
 * The native CCP iframe is initialized invisibly; all controls are rendered using our design system.
 *
 * References:
 * - AWS Workshop (Invisible CCP)
 * - Streams cheat-sheet: https://github.com/amazon-connect/amazon-connect-streams/blob/master/cheat-sheet.md
 */
export default function CustomCCP({
  instanceUrl,
  theme = "dark",
  accentColor,
  title,
  subtitle,
  dialerLeft,
  className,
  leadId,
  contactId,
  autoStartVoiceHub,
}: {
  instanceUrl?: string;
  theme?: "dark" | "light";
  accentColor?: string;
  title?: string;
  subtitle?: string;
  dialerLeft?: boolean;
  className?: string;
  leadId?: string;
  contactId?: string;
  autoStartVoiceHub?: boolean;
}) {
  // Hidden CCP container for Streams provider
  const ccpContainerRef = useRef<HTMLDivElement | null>(null);

  // Streams and guards
  const connectRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const initRef = useRef<boolean>(false);
  // Resolved CCP URL and readiness/fallback flags
  const ccpResolvedUrlRef = useRef<string | null>(null);
  const ccpReadyRef = useRef<boolean>(false);
  const ccpFallbackAttemptedRef = useRef<boolean>(false);

  // Agent/contact session
  const agentRef = useRef<any>(null);
  const contactRef = useRef<any>(null);
  const phoneNumberRef = useRef<string>(""); // for outbound dialing (E.164)
  const hangupInProgressRef = useRef<boolean>(false); // guard against duplicate hangups

  // UI state
  const [initializing, setInitializing] = useState<boolean>(false);
  const [launched, setLaunched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Agent / Contact / Logs
  const [agentName, setAgentName] = useState<string>("");
  const [agentState, setAgentState] = useState<string>("");
  const [routingProfile, setRoutingProfile] = useState<string>("");
  const [contactStatus, setContactStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);

  // Dialer UI (numpad-style)
  const [displayNumber, setDisplayNumber] = useState<string>("");
  function appendDial(char: string) {
    setDisplayNumber((prev) => {
      let base = (prev || "").replace(/[^\d+]/g, "");
      if (char === "+") return base.startsWith("+") ? base : "+" + base;
      if (!base.startsWith("+")) base = "+" + base.replace(/^\+*/, "");
      const digit = char.replace(/[^\d]/g, "");
      return base + digit;
    });
  }

  // Handle Numpad Click
  function handlePadClick(key: string | number) {
    const k = String(key);
    // If connected, send DTMF
    if (contactStatus === "Connected") {
      // Map CLR/Del to nothing or maybe hangup? Standard keypad has *, 0, #
      if (k === "Clear" || k === "Del") return;
      sendDtmf(k);
      return;
    }

    // Otherwise, standard dialing input
    if (k === "Clear") {
      clearDial();
    } else if (k === "Del") { // Backspace
      backspaceDial();
    } else {
      appendDial(k);
    }
  }
  function backspaceDial() {
    setDisplayNumber((prev) => {
      const base = prev || "";
      if (!base) return "";
      const next = base.slice(0, -1);
      return next === "+" ? "" : next;
    });
  }
  function clearDial() {
    setDisplayNumber("");
  }
  function sendDtmf(digit: string) {
    try {
      const conn = contactRef.current?.getAgentConnection?.();
      if (conn?.sendDigits) {
        conn.sendDigits(digit);
        logInfoMsg(`Sent DTMF ${digit}`);
      } else {
        logInfoMsg("DTMF not available on current connection");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to send DTMF");
    }
  }

  const urlBase = useMemo(() => {
    return instanceUrl || (process.env.NEXT_PUBLIC_CONNECT_BASE_URL || "https://ledger1crm.my.connect.aws");
  }, [instanceUrl]);

  function logInfoMsg(msg: string) {
    try {
      connectRef.current?.getLog?.().info?.(msg);
    } catch { }
    setLogs((prev) => [new Date().toLocaleTimeString() + " " + msg, ...prev].slice(0, 200));
  }
  function logInfoEvent(msg: string) {
    try {
      connectRef.current?.getLog?.().info?.(msg);
    } catch { }
    setEvents((prev) => [new Date().toLocaleTimeString() + " " + msg, ...prev].slice(0, 200));
  }

  async function handleLaunch() {
    try {
      // Mic permission on user gesture
      if (navigator?.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      setError(`Microphone permission not granted. Please allow mic access and retry. ${permErr?.message || ""}`);
    } finally {
      setLaunched(true);
    }
  }

  async function loadStreamsScript(): Promise<void> {
    // Try local vendor, then env override, then official CDNs
    const candidates: string[] = [
      "/connect/connect-streams.js",
      String(process.env.NEXT_PUBLIC_CONNECT_STREAMS_URL || ""),
      "https://cdn.connect.aws/connect-streams.js",
      "https://cdn.connect.amazon.com/connect-streams.js",
    ].filter((u) => typeof u === "string" && u.length > 0);

    for (const u of candidates) {
      try {
        if ((window as any).connect) return;
        const s = document.createElement("script");
        s.src = u;
        s.async = true;
        const p = new Promise<void>((resolve, reject) => {
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load Streams SDK from ${u}`));
        });
        document.head.appendChild(s);
        scriptRef.current = s;
        await p;
        if ((window as any).connect) return;
      } catch {
        // continue
      }
    }
    throw new Error("Amazon Connect Streams SDK not available. Vendor locally or set NEXT_PUBLIC_CONNECT_STREAMS_URL.");
  }

  // Initialize (hidden) CCP provider and bind agent/contact events
  useEffect(() => {
    let mounted = true;
    if (!launched) return;
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        setInitializing(true);
        // Load Streams
        let connect = (window as any).connect;
        if (!connect) {
          await loadStreamsScript();
          connect = (window as any).connect;
        }
        connectRef.current = connect;
        if (!connect) throw new Error("Amazon Connect Streams SDK not available");
        if (!ccpContainerRef.current) throw new Error("Hidden CCP container not ready");

        // Set logger verbosity
        const rootLogger = connect.getLog?.();
        try {
          rootLogger?.setLogLevel?.(connect.LogLevel?.DEBUG);
          rootLogger?.setEchoLevel?.(connect.LogLevel?.DEBUG);
        } catch { }

        // Prevent duplicate init across route changes
        const g = (window as any);
        if (g.__ccpProviderInit === true || g.__ccpProviderInitializing === true) {
          logInfoMsg("CCP provider already initialized; skipping");
          return;
        }
        g.__ccpProviderInitializing = true;

        // Initialize CCP invisibly (with URL probe/fallback and increased load timeouts)
        const primaryUrl = `${urlBase}/connect/ccp-v2${theme === "dark" ? "?theme=dark" : ""}`;
        const fallbackUrl = `${urlBase}/ccp-v2${theme === "dark" ? "?theme=dark" : ""}`;
        logInfoMsg(`CRM origin: ${window.location.origin}. Add this origin in Amazon Connect Approved origins.`);

        const initAt = (url: string) => {
          logInfoMsg(`Initializing CCP at ${url}`);
          connect.core.initCCP(ccpContainerRef.current, {
            ccpUrl: url,
            loginPopup: true,
            loginPopupAutoClose: true,
            loginOptions: { autoClose: true, height: 600, width: 400, top: 0, left: 0 },
            softphone: {
              allowFramedSoftphone: true,
              disableRingtone: true,
              allowFramedVideoCall: false,
              allowEarlyGum: true,
            },
            region: (process.env.AWS_REGION || "us-west-2"),
            pageOptions: {
              enableAudioDeviceSettings: true,
              enableVideoDeviceSettings: false,
              enablePhoneTypeSettings: true,
            },
            shouldAddNamespaceToLogs: false,
            ccpAckTimeout: 30000,
            ccpSynTimeout: 20000,
            ccpLoadTimeout: 60000,
          });

          // Mark ready when CCP finishes loading
          try {
            connect.core.onReady?.(() => {
              logInfoMsg("CCP ready");
              ccpReadyRef.current = true;
              ccpResolvedUrlRef.current = url;
              g.__ccpProviderInit = true;
              g.__ccpProviderInitializing = false;
            });
          } catch { }

          // Fallback: if CCP doesn't become ready within timeout, try alternate path once
          const fallbackMs = 30000 + 5000; // ccpLoadTimeout + 5s buffer
          window.setTimeout(() => {
            if (!ccpReadyRef.current && !ccpFallbackAttemptedRef.current) {
              try {
                ccpFallbackAttemptedRef.current = true;
                logInfoMsg(`CCP not ready after ${fallbackMs}ms; attempting fallback URL`);
                connect.core.terminate?.();
              } catch { }
              try {
                initAt(fallbackUrl);
              } catch (err: any) {
                setError(err?.message || "Failed to initialize CCP fallback");
                g.__ccpProviderInitializing = false;
              }
            }
          }, fallbackMs);
        }

        g.__ccpProviderInitializing = true;
        initAt(primaryUrl);

        // Subscribe to core view events
        try {
          connect.core.onViewContact((event: any) => {
            logInfoEvent(`[onViewContact] Viewing contact ${event?.contactId || "?"}`);
          });
        } catch { }

        // Subscribe to Agent
        connect.agent((agent: any) => {
          try {
            agentRef.current = agent;
            // Mark CCP ready when agent is available (robust readiness signal if core.onReady is unavailable)
            if (!ccpReadyRef.current) {
              ccpReadyRef.current = true;
              if (!ccpResolvedUrlRef.current) ccpResolvedUrlRef.current = primaryUrl;
              g.__ccpProviderInit = true;
              g.__ccpProviderInitializing = false;
            }
            setAgentName(String(agent.getName?.() || ""));
            const st = agent.getStatus?.();
            setAgentState(st?.name ? String(st.name) : "");
            setRoutingProfile(String(agent.getConfiguration?.().routingProfile?.name || ""));
            logInfoMsg(`Subscribing to agent ${agent.getName?.() || ""}`);
            logInfoMsg(`Agent status: ${agent.getStatus?.().name || ""}`);
            logInfoMsg(`Routing profile: ${agent.getConfiguration?.().routingProfile?.name || ""}`);

            agent.onRefresh?.((ag: any) => {
              logInfoEvent(`[agent.onRefresh] ${ag.getStatus?.().name || ""}`);
              setAgentState(String(ag.getStatus?.().name || ""));
            });
            agent.onStateChange?.((ag: any) => {
              logInfoEvent(`[agent.onStateChange] new=${ag?.newState} old=${ag?.oldState}`);
              const s = agentRef.current?.getStatus?.();
              setAgentState(s?.name ? String(s.name) : "");
            });
            agent.onRoutable?.((ag: any) => {
              logInfoEvent(`[agent.onRoutable] ${ag.getStatus?.().name || ""}`);
              setAgentState(String(ag.getStatus?.().name || ""));
            });
            agent.onNotRoutable?.((ag: any) => {
              logInfoEvent(`[agent.onNotRoutable] ${ag.getStatus?.().name || ""}`);
              setAgentState(String(ag.getStatus?.().name || ""));
            });
            agent.onOffline?.((ag: any) => {
              logInfoEvent(`[agent.onOffline] ${ag.getStatus?.().name || ""}`);
              setAgentState(String(ag.getStatus?.().name || ""));
            });
            agent.onAfterCallWork?.((ag: any) => {
              logInfoEvent(`[agent.onAfterCallWork] ${ag.getStatus?.().name || ""}`);
              setAgentState(String(ag.getStatus?.().name || ""));
            });
          } catch { }
        });

        // Subscribe to Contact
        connect.contact((contact: any) => {
          try {
            contactRef.current = contact;
            setContactStatus(String(contact.getStatus?.().type || ""));
            logInfoMsg("Subscribing to contact events");

            contact.onIncoming?.((c: any) => {
              logInfoEvent(`[contact.onIncoming] state=${c.getStatus?.().type || ""}`);
              setContactStatus(String(c.getStatus?.().type || ""));
            });
            contact.onAccepted?.((c: any) => {
              logInfoEvent(`[contact.onAccepted] state=${c.getStatus?.().type || ""}`);
              setContactStatus(String(c.getStatus?.().type || ""));
            });
            contact.onConnecting?.((c: any) => {
              logInfoEvent(`[contact.onConnecting] state=${c.getStatus?.().type || ""}`);
              setContactStatus(String(c.getStatus?.().type || ""));
            });
            contact.onConnected?.((c: any) => {
              logInfoEvent(`[contact.onConnected] state=${c.getStatus?.().type || ""}`);
              setContactStatus("Connected");
            });
            contact.onEnded?.((c: any) => {
              logInfoEvent(`[contact.onEnded] state=${c.getStatus?.().type || ""}`);
              setContactStatus("Ended");
              hangupInProgressRef.current = false;
            });
            contact.onDestroy?.(() => {
              logInfoEvent(`[contact.onDestroy] destroyed`);
              setContactStatus("Destroyed");
              hangupInProgressRef.current = false;
            });
          } catch { }
        });
      } catch (e: any) {
        console.error("[CUSTOM_CCP_INIT]", e);
        try {
          const g = (window as any);
          g.__ccpProviderInitializing = false;
          g.__ccpProviderInit = false;
        } catch { }
        const hint = "\nTip: vendor Streams locally under /connect/connect-streams.js or set NEXT_PUBLIC_CONNECT_STREAMS_URL.";
        setError((e?.message || String(e)) + hint);
      } finally {
        setInitializing(false);
      }
    }

    init();

    return () => {
      mounted = false;
      try {
        const s = scriptRef.current;
        if (s && s.parentNode) {
          s.parentNode.removeChild(s);
          scriptRef.current = null;
        }
        // Keep CCP upstream alive across view switches to avoid Streams StateError:
        // "There is no upstream conduit!" when other views (e.g., Engage AI) still depend on CCP.
        // If a full teardown is required, perform connect.core.terminate() from a global shutdown routine.
        const g = (window as any);
        // Preserve provider init flag so upstream remains active.
        g.__ccpProviderInit = true;
      } catch { }
    };
  }, [launched, urlBase, theme]);

  // Actions: Agent state
  function goAvailable() {
    try {
      const agent = agentRef.current;
      const states = agent?.getAgentStates?.() || [];
      const routable = states.find((s: any) => s.type === "ROUTABLE") || states[0];
      agent.setState(routable, {
        success: () => {
          logInfoMsg("Agent set to Available (routable)");
        },
        failure: () => {
          logInfoMsg("Failed to set Available");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Failed to set Available");
    }
  }
  function goBreak() {
    try {
      const agent = agentRef.current;
      const states = agent?.getAgentStates?.() || [];
      const notRoutableCandidates = states.filter((s: any) => s.type === "NOT_ROUTABLE");
      const notRoutable = notRoutableCandidates[1] || notRoutableCandidates[0] || states.find((s: any) => s.type === "NOT_ROUTABLE");
      agent.setState(notRoutable, {
        success: () => {
          logInfoMsg("Agent set to Break (not routable)");
        },
        failure: () => {
          logInfoMsg("Failed to set Break");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Failed to set Break");
    }
  }
  function goOffline() {
    try {
      const agent = agentRef.current;
      const states = agent?.getAgentStates?.() || [];
      const offline = states.find((s: any) => s.type === "OFFLINE") || states[0];
      agent.setState(offline, {
        success: () => {
          logInfoMsg("Agent set to Offline");
        },
        failure: () => {
          logInfoMsg("Failed to set Offline");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Failed to set Offline");
    }
  }

  // Actions: Contact
  function acceptContact() {
    try {
      const c = contactRef.current;
      if (!c) throw new Error("No active contact");
      c.accept?.({
        success: () => {
          logInfoMsg("Accepted contact");
        },
        failure: () => {
          logInfoMsg("Failed to accept contact");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Accept failed");
    }
  }
  function disconnectContact() {
    try {
      const c = contactRef.current;
      const agentConn = c?.getAgentConnection?.();
      if (!agentConn) throw new Error("No agent connection");
      agentConn.destroy?.({
        success: () => {
          logInfoMsg("Disconnected (agent connection destroyed)");
        },
        failure: () => {
          logInfoMsg("Failed to disconnect");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Disconnect failed");
    }
  }
  function clearContact() {
    try {
      const c = contactRef.current;
      c?.clear?.({
        success: () => {
          logInfoMsg("Cleared contact");
        },
        failure: () => {
          logInfoMsg("Failed to clear contact");
        },
      });
    } catch (e: any) {
      setError(e?.message || "Clear failed");
    }
  }

  // Outbound Dial (Streams client)
  async function dialNumber(num: string) {
    try {
      const n = String(num || "").trim();
      if (!/^\+[1-9]\d{1,14}$/.test(n)) throw new Error("Invalid E.164");
      phoneNumberRef.current = n;

      // Auto-start VoiceHub session for Engage AI panel if enabled
      try {
        if (autoStartVoiceHub) {
          const walletOverride = String(localStorage.getItem("voicehub:wallet") || "").trim().toLowerCase();
          const payload: any = { leadId, contactId, source: "CustomCCP" };

          // Silent credit check + robust start with retries and correlationId
          let unlimited = false;
          try {
            const credRes = await fetch("/api/voicehub/credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletOverride: walletOverride || undefined }),
            });
            const cred = await credRes.json().catch(() => ({}));
            if (credRes.ok) {
              const bal = Number((cred as any)?.balance?.balanceSeconds ?? 0);
              unlimited = !!(cred as any)?.balance?.unlimited;
              logInfoMsg(`VoiceHub credits: balanceSeconds=${bal}${unlimited ? " (unlimited)" : ""}`);
            } else {
              logInfoMsg(`Credit check failed: ${(cred as any)?.error || credRes.status}`);
            }
          } catch (e: any) {
            logInfoMsg(`Credit check error: ${e?.message || String(e)}`);
          }

          // SuperAdmin skip: owner wallet has unlimited
          const owner = String(process.env.NEXT_PUBLIC_OWNER_WALLET || "").toLowerCase();
          const isOwner = !!walletOverride && walletOverride === owner;

          const correlationId = `crm:${String(leadId || "none")}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

          let started = false;
          for (let attempt = 1; attempt <= 3 && !started; attempt++) {
            // Open Console on first attempt only if credits not unlimited and not SuperAdmin
            if (attempt === 1 && !unlimited && !isOwner) {
              try {
                const vhBase = String(process.env.NEXT_PUBLIC_VOICEHUB_BASE_URL || "").trim();
                if (vhBase) {
                  const win = window.open(`${vhBase}/console`, "_blank", "noopener,noreferrer");
                  if (!win) {
                    logInfoMsg("Popup blocked for VoiceHub Console; enable popups to approve credits");
                  }
                } else {
                  logInfoMsg("NEXT_PUBLIC_VOICEHUB_BASE_URL not set; cannot open Console for credit approval");
                }
              } catch (openErr: any) {
                logInfoMsg(`Failed to open VoiceHub Console: ${openErr?.message || String(openErr)}`);
              }
            }

            const res = await fetch("/api/voicehub/control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ command: "start", payload, walletOverride: walletOverride || undefined, correlationId }),
            });
            if (res.ok) {
              started = true;
              logInfoMsg(`Requested VoiceHub auto-start (attempt ${attempt})`);
            } else {
              logInfoMsg(`VoiceHub start request failed (attempt ${attempt}): ${res.status}`);
              await sleep(400 * attempt); // exponential backoff
            }
          }

          if (!started) {
            logInfoMsg("VoiceHub start failed after retries");
          }
        }
      } catch (e: any) {
        logInfoMsg(`VoiceHub auto-start failed: ${e?.message || String(e)}`);
      }

      // Use Streams Agent.connect with Endpoint.byPhoneNumber for outbound
      const winAny = (window as any);
      const agent =
        agentRef.current ||
        (typeof winAny.connect?.agent === "function" ? winAny.connect.agent() : null);
      if (!agent) throw new Error("Agent not initialized");

      // Optional: ensure agent is routable; otherwise Agent.connect may fail
      try {
        const st = agent.getState?.();
        if (st?.type && st.type !== (winAny.connect?.AgentStateType?.ROUTABLE || "ROUTABLE")) {
          logInfoMsg(`Agent state is ${st?.type}; outbound may fail unless routable`);
        }
      } catch { }

      const ep = winAny.connect?.Endpoint?.byPhoneNumber
        ? winAny.connect.Endpoint.byPhoneNumber(n)
        : null;
      if (!ep) throw new Error("Streams Endpoint API not available");

      await new Promise<void>((resolve, reject) => {
        agent.connect(ep, {
          success: () => resolve(),
          failure: () => reject(new Error("Failed to start outbound call")),
        });
      });

      logInfoMsg(`Dialing ${n}`);
    } catch (e: any) {
      setError(e?.message || "Dial failed");
    }
  }

  function hangupActive() {
    try {
      // Request VoiceHub stop listening when Hang Up is pressed
      try {
        const walletOverride = String(localStorage.getItem("voicehub:wallet") || "").trim().toLowerCase();
        const payload: any = { leadId, contactId, source: "CustomCCP" };
        void fetch("/api/voicehub/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "stop", payload, walletOverride: walletOverride || undefined }),
        })
          .then(() => logInfoMsg("Requested VoiceHub stop listening"))
          .catch((e) => logInfoMsg(`VoiceHub stop failed: ${e?.message || String(e)}`));
      } catch { }
      const c = contactRef.current;
      if (!c) throw new Error("No active contact");
      if (hangupInProgressRef.current) {
        logInfoMsg("Hangup already in progress; ignoring duplicate request");
        return;
      }
      hangupInProgressRef.current = true;

      const agentConn = c.getAgentConnection?.();
      let attempted = false;

      if (agentConn?.destroy) {
        attempted = true;
        agentConn.destroy({
          success: () => {
            logInfoMsg("Disconnected (agent connection destroyed)");
          },
          failure: () => {
            logInfoMsg("Destroy failed; attempting clear()");
            try {
              c.clear?.({
                success: () => {
                  logInfoMsg("Cleared contact after destroy failure");
                },
                failure: () => {
                  try {
                    c.completeContact?.();
                    logInfoMsg("Completed contact after clear failure");
                  } catch (e) {
                    setError("Failed to complete contact after clear failure");
                  }
                },
              });
            } catch (e: any) {
              setError(e?.message || "Clear failed after destroy failure");
            }
          },
        });

        // Fallback timeout if neither onEnded nor onDestroy fires
        window.setTimeout(() => {
          try {
            if (hangupInProgressRef.current) {
              const st = c.getStatus?.()?.type || "";
              if (st !== "Ended" && st !== "Destroyed") {
                logInfoMsg("Hangup timeout; attempting clear()");
                c.clear?.({
                  success: () => {
                    logInfoMsg("Cleared contact on timeout");
                    hangupInProgressRef.current = false;
                  },
                  failure: () => {
                    try {
                      c.completeContact?.();
                      logInfoMsg("Completed contact on timeout after clear failure");
                    } catch (e) {
                      // swallow
                    } finally {
                      hangupInProgressRef.current = false;
                    }
                  },
                });
              } else {
                hangupInProgressRef.current = false;
              }
            }
          } catch {
            hangupInProgressRef.current = false;
          }
        }, 5000);

        return;
      }

      // If no agent connection destroy available, try clear then complete
      if (c.clear) {
        attempted = true;
        c.clear({
          success: () => {
            logInfoMsg("Cleared contact");
          },
          failure: () => {
            try {
              c.completeContact?.();
              logInfoMsg("Completed contact after clear failure");
            } catch (e) {
              setError("Failed to complete contact");
            }
          },
        });
        return;
      }

      if (c.completeContact) {
        attempted = true;
        c.completeContact();
        logInfoMsg("Completed contact");
        return;
      }

      if (!attempted) throw new Error("No supported hangup method available");
    } catch (e: any) {
      setError(e?.message || "Hangup failed");
    }
  }

  // postMessage bridge for DialerPanel integration
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      try {
        const allowedOrigins = (() => {
          const arr: string[] = [window.location.origin];
          const base = String(process.env.NEXT_PUBLIC_CONNECT_BASE_URL || "").replace(/\/+$/, "");
          if (base) arr.push(base);
          try {
            const resolved = ccpResolvedUrlRef.current || urlBase;
            if (resolved) arr.push(new URL(resolved).origin);
          } catch { }
          return arr.filter(Boolean);
        })();
        if (!allowedOrigins.includes(ev.origin)) return;
        const data: any = ev.data || {};
        const type = String(data?.type || "");
        if (type === "softphone:setNumber") {
          phoneNumberRef.current = String(data?.number || "");
          ev.source?.postMessage({ type: "softphone:status", status: contactStatus || "" }, { targetOrigin: ev.origin });
        } else if (type === "softphone:dial") {
          void dialNumber(phoneNumberRef.current);
        } else if (type === "softphone:hangup") {
          hangupActive();
        } else if (type === "softphone:getStatus") {
          ev.source?.postMessage({ type: "softphone:status", status: contactStatus || "" }, { targetOrigin: ev.origin });
        }
      } catch { }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactStatus]);

  // Suppress benign Streams SDK console errors for known noisy patterns
  useEffect(() => {
    const original = console.error;
    function filtered(...args: any[]) {
      try {
        const flat = args.map(a => (typeof a === "string" ? a : (a?.message || ""))).join(" ");
        const noHandler = flat.includes("No handler for invoked request");
        const deviceEnum = flat.includes("Failed to enumerate media devices");
        const asyncLoader = flat.includes("fac.asyncLoader") || flat.includes("Item failed to load within timeout");
        const routerReqErr = flat.includes("engine.router.requestErrorHandler");
        if (noHandler || deviceEnum || asyncLoader || routerReqErr) {
          return;
        }
      } catch { }
      original(...args);
    }
    console.error = filtered as any;
    return () => {
      console.error = original;
    };
  }, []);

  // Use theme primary color unless an explicit accentColor is provided
  const accent = accentColor || "hsl(var(--primary))";

  // State for collapsible debug logs
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className={`flex flex-col h-full bg-background ${className || ""}`}>
      {/* Header / Connection Status */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${ccpReadyRef.current ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-xs font-semibold text-foreground/80">{title || "Softphone"}</span>
        </div>
        <div className="flex items-center gap-1">
          {!launched ? (
            <Button size="sm" variant="outline" onClick={handleLaunch} disabled={initializing} className="h-6 text-[10px]">
              {initializing ? "Init..." : "Launch"}
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              {/* Connection Status Indicator */}
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${contactStatus === "Connected" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                contactStatus ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-slate-500/10 text-muted-foreground border-border"
                }`}>
                {contactStatus || "Idle"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden CCP iframe container */}
      <div ref={ccpContainerRef} style={{ display: "none" }} />

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Agent Controls Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Agent Status</span>
            <span className={`text-[10px] font-mono ${agentState === "Available" || agentState === "Routable" ? "text-emerald-500" : "text-amber-500"}`}>
              {agentState || "Unknown"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={agentState === "Available" || agentState === "Routable" ? "default" : "outline"}
              className={`h-14 flex flex-col gap-1 items-center justify-center border-dashed border-2 ${agentState === "Available" || agentState === "Routable" ? "border-solid border-emerald-500 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-600" : "hover:bg-emerald-500/5 hover:text-emerald-600 hover:border-emerald-500/50"}`}
              onClick={goAvailable}
            >
              <UserCheck className="h-4 w-4" />
              <span className="text-[10px] font-medium">Available</span>
            </Button>
            <Button
              variant={agentState !== "Available" && agentState !== "Offline" && agentState ? "default" : "outline"}
              className="h-14 flex flex-col gap-1 items-center justify-center hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/50"
              onClick={goBreak}
            >
              <Coffee className="h-4 w-4" />
              <span className="text-[10px] font-medium">Break</span>
            </Button>
            <Button
              variant={agentState === "Offline" ? "destructive" : "outline"}
              className="h-14 flex flex-col gap-1 items-center justify-center hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50"
              onClick={goOffline}
            >
              <Power className="h-4 w-4" />
              <span className="text-[10px] font-medium">Offline</span>
            </Button>
          </div>
        </div>

        {/* Active Call Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Call</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={acceptContact}
              disabled={!contactStatus || contactStatus === "Connected"}
              className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
            >
              <Phone className="h-4 w-4 mr-2" />
              <span className="text-xs">Answer</span>
            </Button>
            <Button
              onClick={hangupActive}
              variant="destructive"
              className="h-12 shadow-md shadow-red-500/20"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              <span className="text-xs">Hang Up</span>
            </Button>
            <Button
              onClick={clearContact}
              variant="secondary"
              className="h-12"
            >
              <X className="h-4 w-4 mr-2" />
              <span className="text-xs">Close</span>
            </Button>
          </div>
        </div>

        {/* Numpad Section */}
        <div className="pt-2">
          <div className="bg-card/50 rounded-xl p-3 border shadow-inner">
            {/* Number Display */}
            <div className="relative mb-3">
              <Input
                value={displayNumber}
                onChange={(e) => setDisplayNumber(e.target.value)}
                className="text-center text-xl font-mono h-12 bg-background border-muted shadow-sm pr-10"
                placeholder="Enter Number..."
              />
              <button
                onClick={backspaceDial}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {contactStatus === "Connected" ? (
                /* Connected: Standard DTMF Layout (1-9, *, 0, #) */
                [1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handlePadClick(key)}
                    className="h-10 text-lg font-medium transition-all active:scale-95 hover:bg-primary/10 hover:border-primary/50 text-foreground"
                  >
                    {key}
                  </Button>
                ))
              ) : (
                /* Dialing: Input Layout (1-9, +, 0, CLR) */
                [1, 2, 3, 4, 5, 6, 7, 8, 9, "+", 0, "Clear"].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handlePadClick(key)}
                    className={`h-10 text-lg font-medium transition-all active:scale-95 ${key === "Clear" ? "text-xs text-muted-foreground uppercase tracking-widest" : "hover:bg-primary/5 hover:border-primary/30 text-foreground"}`}
                  >
                    {key === "Clear" ? "CLR" : key}
                  </Button>
                ))
              )}
            </div>

            {/* Dial Button */}
            <Button
              onClick={() => dialNumber(displayNumber)}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-lg"
              disabled={!displayNumber}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Now
            </Button>
          </div>

          <div className="mt-2 text-[10px] text-center text-muted-foreground/60">
            E.164 Format Required (e.g. +1555...)
          </div>
        </div>

        {/* Debug / Logs Expansion */}
        {/* Debug / Logs Expansion */}
        <div className="border rounded-lg bg-muted/20">
          <div
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30"
            onClick={() => setDebugOpen(!debugOpen)}
          >
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              System Logs & Events
            </span>
            {debugOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
          </div>

          {debugOpen && (
            <div className="p-2 border-t space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase block mb-1">Logs</label>
                <Textarea value={logs.join("\n")} readOnly className="h-20 text-[9px] font-mono bg-background resize-none" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase block mb-1">Events</label>
                <Textarea value={events.join("\n")} readOnly className="h-20 text-[9px] font-mono bg-background resize-none" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}
      </div>
    </div>
  );
}
