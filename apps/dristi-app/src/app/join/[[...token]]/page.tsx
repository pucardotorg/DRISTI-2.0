import { JoinPage } from "./join-flow";

export const dynamicParams = false;

export function generateStaticParams() {
  // `/join` has to be generated too. It is the entry for everyone who did not scan a
  // summons QR — an advocate at their desk, a clerk, someone who found the site through
  // search — and it was 404ing because only the token form was listed.
  return [{ token: [] }, { token: ["demo"] }];
}

export default function Page() {
  return <JoinPage />;
}
