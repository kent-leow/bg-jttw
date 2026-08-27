import { useEffect, useState } from "react";
import { decryptOwnPayload } from "../crypto/decryptOwnPayload";
import type { EncryptedEnvelope } from "../crypto/encryptForPlayer";
import type { HiddenKnowledge } from "../engine/hiddenKnowledge";
import type { RoleDefinition } from "../engine/types";
import { useTranslation } from "../i18n";

export interface RoleRevealPayload {
  readonly role: RoleDefinition;
  readonly hiddenKnowledge: HiddenKnowledge;
}

export interface RoleRevealPageProps {
  readonly privateKey: CryptoKey;
  readonly encryptedEnvelope: EncryptedEnvelope;
  readonly decrypt?: typeof decryptOwnPayload<RoleRevealPayload>;
}

export function RoleRevealPage({ privateKey, encryptedEnvelope, decrypt = decryptOwnPayload }: RoleRevealPageProps) {
  const [payload, setPayload] = useState<RoleRevealPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    setPayload(null);
    setFailed(false);
    decrypt(privateKey, encryptedEnvelope)
      .then((result) => {
        if (!cancelled) {
          setPayload(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [privateKey, encryptedEnvelope, decrypt]);

  if (failed) {
    return (
      <section>
        <p role="alert">{t("roleReveal.unableToReveal")}</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section>
        <p role="status">{t("roleReveal.revealing")}</p>
      </section>
    );
  }

  const { role, hiddenKnowledge } = payload;
  return (
    <section>
      <h1 data-testid="role-name">{role.name}</h1>
      <p data-testid="role-alignment">{role.alignment}</p>
      {hiddenKnowledge.evilPlayerIds && (
        <ul aria-label="Known evil players" data-testid="known-evil-players">
          {hiddenKnowledge.evilPlayerIds.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      )}
      {hiddenKnowledge.merlinOrMorganaPlayerIds && (
        <ul aria-label="Merlin or Morgana candidates" data-testid="merlin-or-morgana">
          {hiddenKnowledge.merlinOrMorganaPlayerIds.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      )}
      {hiddenKnowledge.fellowMinionPlayerIds && (
        <ul aria-label="Fellow minions" data-testid="fellow-minions">
          {hiddenKnowledge.fellowMinionPlayerIds.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
