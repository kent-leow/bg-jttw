export interface MissionResultPageProps {
  readonly result: "Success" | "Fail";
}

export function MissionResultPage({ result }: MissionResultPageProps) {
  return (
    <section>
      <h1>Mission Result</h1>
      <p data-testid="mission-result">{result}</p>
    </section>
  );
}
