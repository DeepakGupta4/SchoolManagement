"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, Input, useToast } from "@/components/ui";
import { QrCode } from "@/components/cards/QrCode";
import { get2faStatus, setup2fa, enable2fa, disable2fa } from "@/lib/api/auth";
import { useAuthStore } from "@/store";

/**
 * Authenticator-app two-factor auth for the signed-in account. Enrol by scanning
 * a QR (or typing the secret), confirm a code, and 2FA is required at every
 * future sign-in. Disabling needs a current code so a stolen session can't do it.
 */
export function TwoFactorCard() {
  const { toast } = useToast();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [disarming, setDisarming] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    get2faStatus()
      .then((s) => !cancelled && setEnabled(s.enabled))
      .catch(() => !cancelled && setEnabled(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const begin = async () => {
    setBusy(true);
    try {
      setSetup(await setup2fa());
      setCode("");
    } catch (e) {
      toast({ title: "Couldn't start setup", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    setBusy(true);
    try {
      await enable2fa(code);
      setEnabled(true);
      setSetup(null);
      setCode("");
      updateUser({ twoFactorEnabled: true });
      toast({ title: "Two-factor enabled", description: "You'll be asked for a code at every sign-in." });
    } catch (e) {
      toast({ title: "Couldn't enable 2FA", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    try {
      await disable2fa(code);
      setEnabled(false);
      setDisarming(false);
      setCode("");
      updateUser({ twoFactorEnabled: false });
      toast({ title: "Two-factor disabled" });
    } catch (e) {
      toast({ title: "Couldn't disable 2FA", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const onCode = (v: string) => setCode(v.replace(/\D/g, "").slice(0, 6));

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted" />
          <h2 className="text-sm font-semibold text-text">Two-factor authentication</h2>
        </div>
        {enabled !== null &&
          (enabled ? <Badge variant="success">On</Badge> : <Badge variant="default">Off</Badge>)}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Add a second step at sign-in using an authenticator app (Google Authenticator, Authy, etc.).
          Even if your password leaks, your account stays protected.
        </p>

        {/* Off → offer to enable */}
        {enabled === false && !setup && (
          <Button onClick={begin} disabled={busy}>
            <Smartphone className="size-4" /> Enable 2FA
          </Button>
        )}

        {/* Enrolment: QR + secret + confirm code */}
        {setup && (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-hover p-4 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-md bg-white p-2 ring-1 ring-border">
              <QrCode value={setup.otpauthUri} className="size-40" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-text">1. Scan this QR in your authenticator app</p>
                <p className="mt-1 break-all text-xs text-subtle">
                  Or enter the key manually: <span className="font-mono text-text">{setup.secret}</span>
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-text">2. Enter the 6-digit code it shows</p>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => onCode(e.target.value)}
                    placeholder="000000"
                    className="w-32 text-center font-mono tracking-widest"
                  />
                  <Button onClick={confirmEnable} disabled={busy || code.length !== 6}>
                    Verify &amp; enable
                  </Button>
                  <Button variant="ghost" onClick={() => { setSetup(null); setCode(""); }} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* On → offer to disable (needs a code) */}
        {enabled === true && !disarming && (
          <Button variant="outline" onClick={() => { setDisarming(true); setCode(""); }}>
            <ShieldOff className="size-4" /> Disable 2FA
          </Button>
        )}
        {enabled === true && disarming && (
          <div className="flex items-end gap-2">
            <div>
              <p className="mb-1 text-sm text-text">Enter a current code to turn 2FA off</p>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => onCode(e.target.value)}
                placeholder="000000"
                className="w-32 text-center font-mono tracking-widest"
              />
            </div>
            <Button variant="danger" onClick={confirmDisable} disabled={busy || code.length !== 6}>
              Disable
            </Button>
            <Button variant="ghost" onClick={() => { setDisarming(false); setCode(""); }} disabled={busy}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
