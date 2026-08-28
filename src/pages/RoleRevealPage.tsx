import type { HiddenKnowledge } from "../engine/hiddenKnowledge";
import type { RoleDefinition } from "../engine/types";
import { useTranslation } from "../i18n";
import { LanguageToggle } from "./components/LanguageToggle";

export interface RoleRevealPayload {
  readonly role: RoleDefinition;
  readonly hiddenKnowledge: HiddenKnowledge;
}

// Stub types - originally from deleted crypto modules
export interface EncryptedEnvelope {
  readonly ciphertext: string;
  readonly iv: string;
}

export interface RoleRevealPageProps {
  readonly privateKey: CryptoKey;
  readonly encryptedEnvelope: EncryptedEnvelope;
  readonly decrypt?: (privateKey: CryptoKey, envelope: EncryptedEnvelope) => Promise<RoleRevealPayload>;
}

export function RoleRevealPage({ decrypt }: RoleRevealPageProps) {
  const { t } = useTranslation();

  return (
    <section className="page page--centered">
      <LanguageToggle />
      <p role="alert">{t("common.error")}: Role reveal has been removed. This feature will be reimplemented in task-002.</p>
    </section>
  );
}
